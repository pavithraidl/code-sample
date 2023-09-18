import { DateTime } from 'luxon';
import {BaseModel, BelongsTo, belongsTo, column} from '@ioc:Adonis/Lucid/Orm';
import {ProductResourceType} from 'App/Models/Product/ProductResource';
import BookingSchedule from 'App/Models/Booking/BookingSchedule';
import ExceptionHandler from 'App/Exceptions/Handler';
import sendData from '@ioc:App/Helpers/SendData';
import Product from 'App/Models/Product/Product';
import User from 'App/Models/User';
import {SendDataReturn} from '../../../providers/InternalDataTransferProvider';

export default class BookingScheduleResource extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({serializeAs: null})
  public bookingScheduleId: number;

  @column()
  public type: ProductResourceType;

  @column({serializeAs: 'requiredQuantity'})
  public requiredQuantity: number;

  @column({serializeAs: 'resourceDid'})
  public resourceDid: string;

  @column({serializeAs: 'preparationTime'})
  public preparationTime: number;

  @column({serializeAs: 'finalizingTime'})
  public finalizingTime: number;

  @column({serializeAs: null})
  public companyId: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  /**
   * Relationships
   * -------------------------------------------------------------------------------------------------------------------
   */
  @belongsTo(() => BookingSchedule)
  public bookingSchedule: BelongsTo<typeof BookingSchedule>;

  @belongsTo(() => Product, {foreignKey: 'resourceDid', localKey: 'did'})
  public product: BelongsTo<typeof Product>;

  @belongsTo(() => User, {foreignKey: 'resourceDid', localKey: 'did'})
  public user: BelongsTo<typeof User>;

  /**
   * Methods
   * -------------------------------------------------------------------------------------------------------------------
   */
  /**
   * Allocate resources for a booking schedule
   *
   * @param bookingSchedule
   */
  public static async allocate (bookingSchedule: BookingSchedule): Promise<SendDataReturn<boolean>> {
    try {
      await bookingSchedule.load('product', (query) => {
        query.preload('resources', (query) => {
          query.preload('personnels');
        });
      });

      const resources = bookingSchedule.product.resources;
      const bookingScheduleResourcesList: any[] = [];

      for (const resource of resources) {
        switch (resource.type) {
          case 'PERSONNEL':
            let addedPersonnelCount = 0;
            for (const personnel of resource.personnels) {
              bookingScheduleResourcesList.push({
                bookingScheduleId: bookingSchedule.id,
                type: resource.type,
                resourceDid: personnel.did,
                preparationTime: resource.preparationTime,
                finalizingTime: resource.finalizingTime,
                companyId: bookingSchedule.product.companyId,
              });
              addedPersonnelCount++;
            }
            // Overallocate if required quantity is more than available personnel
            while (addedPersonnelCount < resource.requiredQuantity) {
              // Assuming we can duplicate the last personnel
              bookingScheduleResourcesList.push({
                bookingScheduleId: bookingSchedule.id,
                type: resource.type,
                resourceDid: resource.personnels[resource.personnels.length - 1].did,
                preparationTime: resource.preparationTime,
                finalizingTime: resource.finalizingTime,
                companyId: bookingSchedule.product.companyId,
              });
              addedPersonnelCount++;
            }
            break;
          case 'TOOL':
          case 'CONSUMABLE':
            // Overallocate requiredQuantity if necessary
            const requiredQuantity = Math.max(resource.requiredQuantity, bookingScheduleResourcesList.length);
            bookingScheduleResourcesList.push({
              bookingScheduleId: bookingSchedule.id,
              type: resource.type,
              requiredQuantity: requiredQuantity,
              resourceDid: resource.type === 'TOOL' ? resource.toolDid : resource.consumableDid,
              preparationTime: resource.preparationTime,
              finalizingTime: resource.finalizingTime,
              companyId: bookingSchedule.product.companyId,
            });
            break;
        }
      }

      await BookingScheduleResource.createMany(bookingScheduleResourcesList);

      return sendData(true);
    } catch (error) {
      ExceptionHandler.report(error);
      return sendData(false, 500, error);
    }
  }
}
