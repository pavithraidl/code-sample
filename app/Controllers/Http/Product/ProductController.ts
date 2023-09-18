import BaseController from 'App/Controllers/Http/BaseController';
import {HttpContextContract} from '@ioc:Adonis/Core/HttpContext';
import Company from 'App/Models/Company/Company';
import Product from 'App/Models/Product/Product';
import modelSelectionQueries from 'Config/model-selection-queries';
import {createProductModelSchema, updateProductModelSchema} from 'App/Validators/Product/ProductValidator';

export default class ProductController extends BaseController {
  /**
   * Create Product
   *
   * @param request
   */
  public async create ({request}: HttpContextContract) {
    try {
      // Validate the request
      const payload = await request.validate({ schema: createProductModelSchema });

      // Set the company ID
      let companyId: number | null = null;

      // Check if the user has access to the provided company
      if (payload.companyDid) {
        if (!await request.access.checkCompanyAccess(payload.companyDid)) {
          return this.sendResponse({error: 'Provided company does not exists or you do not have permission access it!'}, 404);
        } else {
          const company = await Company.query().where('did', payload.companyDid).first();
          companyId = company?.id || null;
        }
      } else {
        companyId = request.access.myCompanyId;
      }
      if (!companyId) {
        return this.sendResponse({error: 'Company ID is not defined!'}, 500);
      }

      // Create a product
      const product = await Product.createProduct(payload.name, companyId, payload.type);

      return product ? this.sendResponse({data: product.did}, 201) : this.sendResponse({error: `Failed to create a ${payload.type === 'SERVICE' ? 'service' : 'product'}!`}, 500);
    } catch (error) {
      return this.sendResponse({error}, 500);
    }
  }

  /**
   * List Products
   *
   * @param request
   */
  public async list ({request}: HttpContextContract) {
    try {
      const {page, itemsPerPage, sortBy, filters, isBasic, type} = request.all();
      const sortByDecoded = JSON.parse(sortBy);

      // Query string starter
      const query = Product.query().where('type', type || 'PRODUCT');

      // Run through filters
      if (filters) {
        const filtersDecoded: any[] = JSON.parse(filters);

        // @ts-ignore
        for (const [field, params] of Object.entries(filtersDecoded)) {
          if (params.operation === 'where') {
            if (params.field === 'companyDid') {
              query.whereHas('company', ((query) => {
                query.where('did', params.value);
              }));
            } else {
              query.where(field, params.value);
            }
          } else if (params.operation === 'search' && params.value && params.value.length > 2) {
            query.whereIn('id', await Product.search(params.value));
          }
        }
      }

      // Sort by
      if (sortByDecoded && sortByDecoded.length > 0) {
        for (const sort of sortByDecoded) {
          if (sort.key && sort.order) {
            query.orderBy(sort.key, sort.order);
          }
        }
      } else {
        query.orderBy('name', 'asc');
      }

      // If request is basic, return only basic data
      if (isBasic) {
        return this.sendResponse({data: await query.select(modelSelectionQueries.product.basic).paginate(page, itemsPerPage)});
      }

      // Preload relations and field selection
      const product = await query
        .preload('company', (companyQuery) => modelSelectionQueries.company.getBasic(companyQuery, false))
        .select(modelSelectionQueries.product.basic)
        .paginate(page, itemsPerPage);

      return this.sendResponse({data: product});
    } catch (error) {
      return this.sendResponse({error}, 500);
    }
  }

  /**
   * Show Product
   *
   * @param params
   * @param request
   */
  public async show ({params}: HttpContextContract) {
    try {
      const {did} = params;
      const product = await Product.query()
        .where('did', did)
        .preload('company', (companyQuery) => modelSelectionQueries.company.getBasic(companyQuery))
        .preload('pricingModels', (pricingModelQuery) => pricingModelQuery.orderBy('createdAt', 'desc'))
        .preload('resources', (resourceQuery) => modelSelectionQueries.resource.getBasic(resourceQuery))
        .preload('offices', (officeQuery) => modelSelectionQueries.office.getBasic(officeQuery))
        .first();

      return product ? this.sendResponse({data: product}) : this.sendResponse({error: 'Product not found'}, 404);
    } catch (error) {
      return this.sendResponse({error}, 500);
    }
  }

  /**
   * Update Product
   *
   * @param request
   */
  public async update ({request}: HttpContextContract) {
    try {
      // Validate the request
      const payload = await request.validate({ schema: updateProductModelSchema });

      // Update the product
      const updateResponse = await Product.updateProduct(payload.dids, payload.data as any);

      // Return the response
      return updateResponse ? this.sendResponse({data: 'Updated!'}) : this.sendResponse({error: 'Product not found'}, 404);
    } catch (error) {
      return this.sendResponse({error}, 500);
    }
  }
}
