import { DateTime } from 'luxon';
import {
  afterSave,
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm';
import {slugify} from '@ioc:Adonis/Addons/LucidSlugify';
import {compose} from '@poppinss/utils/build/src/Helpers';
import {SoftDeletes} from '@ioc:Adonis/Addons/LucidSoftDeletes';
import {FileItem} from '../../../@types/file';
import Company from 'App/Models/Company/Company';
import CommonSeo from 'App/Models/Common/CommonSeo';
import {randomUUID} from 'crypto';
import ExceptionHandler from 'App/Exceptions/Handler';
import ProductPricingModel from 'App/Models/Product/ProductPricingModel';
import Office from 'App/Models/Office/Office';
import {SendDataReturn} from '../../../providers/InternalDataTransferProvider';
import sendData from '@ioc:App/Helpers/SendData';
import ProductResource from 'App/Models/Product/ProductResource';
import PayProducts from 'App/Services/StripePay/PayProducts';

export type ProductType = 'PRODUCT' | 'SERVICE' | 'TOOL';

export default class Product extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true, serializeAs: null })
  public id: number;

  @column()
  public name: string;

  @column()
  public did: string;

  @column()
  @slugify({
    strategy: 'dbIncrement',
    fields: ['name'],
    maxLength: 255,
  })
  public slug: string;

  @column()
  public description: string | null;

  @column()
  public quantity: number | null;

  @column({serializeAs: 'heroImageUrl'})
  public heroImageUrl: string | null;

  @column()
  public gallery: { data: FileItem[] };

  @column()
  public type: ProductType;

  @column({serializeAs: null})
  public companyId: number;

  @column()
  public meta: {[key: string]: any};

  @column()
  public guid: string;

  @column()
  public status: string;

  @column({serializeAs: null})
  public stripeProductId: string | null;

  @column({serializeAs: null})
  public seoId: number;

  @column({serializeAs: null})
  public indexedAt: DateTime;

  @column.dateTime({ autoCreate: true, serializeAs: 'createdAt' })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: 'updatedAt' })
  public updatedAt: DateTime;

  @column.dateTime({ columnName: 'deleted_at', serializeAs: null })
  public deletedAt: DateTime | null;

  /**
   * Relationships
   * -------------------------------------------------------------------------------------------------------------------
   */
  @belongsTo(() => Company)
  public company: BelongsTo<typeof Company>;

  @belongsTo(() => CommonSeo, {foreignKey: 'seoId'})
  public seo: BelongsTo<typeof CommonSeo>;

  @hasMany(() => ProductPricingModel)
  public pricingModels: HasMany<typeof ProductPricingModel>;

  @hasMany(() => ProductResource)
  public resources: HasMany<typeof ProductResource>;

  @manyToMany(() => Office, {pivotTable: 'product_offices', pivotForeignKey: 'product_id'})
  public offices: ManyToMany<typeof Office>;

  /**
   * Hooks
   * -------------------------------------------------------------------------------------------------------------------
   */
  /**
   * After save product data
   *
   * @param product
   */
  @afterSave()
  public static async completeProductData (product: Product) {
    let changed = false;
    // Set up the product display id  (did)
    if (!product.did) {
      let productDidPrefix = 'PROD';
      switch (product.type) {
        case 'SERVICE':
          productDidPrefix = 'SERV';
          break;
        case 'TOOL':
          productDidPrefix = 'TOOL';
          break;
      }

      product.did = productDidPrefix + ((product.id + 1000).toString(16)).toUpperCase();
      changed = true;
    }

    // Set up the user guid
    if (!product.guid) {
      product.guid = product.id + randomUUID();
      changed = true;
    }

    if (changed) {
      await product.save();
    }
  }

  /**
   * Search products by keywords
   *
   * @param keywords
   */
  public static async search (keywords: string): Promise<number[]> {
    try {
      const formattedKeywords = keywords.split(', ').join(',').split(',').slice(0, 5);
      let resultIdArrays: any[] = [];
      for (const keyword of formattedKeywords) {
        const searchQuery = Product.query();
        const searchResults = await searchQuery
          .whereILike('did', `%${keyword}%`)
          .orWhereILike('name', `%${keyword}%`)
          .orWhereILike('status', `%${keyword}%`)
          .orWhereHas('company', (companyQuery) => {
            companyQuery.whereILike('name', `%${keyword}%`);
          });
        if (searchResults) {
          resultIdArrays.push(searchResults.map((product) => product.id));
        }
      }

      return resultIdArrays.reduce((previous, current) => {
        return previous.filter((value) => current.includes(value));
      });
    } catch (error) {
      ExceptionHandler.report(error);
      return [];
    }
  }

  /**
   * Create a new product
   *
   * @param productName
   * @param companyId
   * @param productType
   */
  public static async createProduct (productName: string, companyId: number, productType: ProductType = 'PRODUCT'): Promise<Product | null> {
    try {
      // Create a new product
      const product = new Product();
      product.name = productName;
      product.companyId = companyId;
      product.type = productType;
      await product.save();

      // Return the product
      return product;
    } catch (error) {
      ExceptionHandler.report(error);
      return null;
    }
  }

  /**
   * Update product data
   */
  public static async updateProduct (productDids: string[], productData: Product): Promise<SendDataReturn> {
    try {
      // Manage office ids
      let officeIds: number[] = [];
      if ((productData as any).officeDids) {
        const offices = await Office.query().whereIn('did', (productData as any).officeDids);
        officeIds = offices.map((office) => office.id);
      }
      delete (productData as any).officeDids;

      const products = await Product.query().whereIn('did', productDids);
      for (const product of products) {
        const statusBeforeUpdate = product.status;
        // set the relationship with officeIds
        await product.related('offices').sync(officeIds);

        // Update the product data
        await product.merge(productData);
        await product.save();

        // if the product status change from DRAFT to ACTIVE
        if (statusBeforeUpdate !== 'ACTIVE' && productData.status === 'ACTIVE' && product.type !== 'TOOL') {
          // Check if the product is ready to be ACTIVE
          const readyToActive = await this.checkProductReadyToActive(product);
          if (!readyToActive.data) {
            product.status = statusBeforeUpdate; // Set the status back to the previous one
            await product.save();
            return sendData(false, 400, 'The product is not ready to be active');
          }

          // Create a new product and pricing models in Stripe
          const payProductCreateResponse = await PayProducts.create(product);
          if (!payProductCreateResponse.data) {
            return sendData(false, 400, payProductCreateResponse.error);
          }
        }
      }

      // Return response
      return sendData(true);
    } catch (error) {
      ExceptionHandler.report(error);
      return sendData(false, 500, error);
    }
  }

  /**
   * Check if the product is ready to be ACTIVE
   * - has a hero image
   * - has an active pricing model
   */
  public static async checkProductReadyToActive (product: Product): Promise<SendDataReturn<boolean>> {
    try {
      await product.load('pricingModels', (pricingModelQuery) => pricingModelQuery.where('status', 'ACTIVE'));

      // Check if the product has a hero image
      if (!product.heroImageUrl) {
        return sendData(false);
      }

      // Check if the product has an active pricing model
      if (product.pricingModels.length !== 1) {
        return sendData(false);
      }

      return sendData(true);
    } catch (error) {
      ExceptionHandler.report(error);
      return sendData(false);
    }
  }
}
