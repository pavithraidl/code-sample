import { DateTime } from 'luxon';
import {afterSave, BaseModel, BelongsTo, belongsTo, column, HasMany, hasMany} from '@ioc:Adonis/Lucid/Orm';
import {compose} from '@poppinss/utils/build/src/Helpers';
import {SoftDeletes} from '@ioc:Adonis/Addons/LucidSoftDeletes';
import BookingSchedule from 'App/Models/Booking/BookingSchedule';
import Customer from 'App/Models/Customer/Customer';
import Product from 'App/Models/Product/Product';
import User from 'App/Models/User';
import {randomUUID} from 'crypto';
import ExceptionHandler from 'App/Exceptions/Handler';
import sendData from '@ioc:App/Helpers/SendData';
import {SendDataReturn} from '../../../providers/InternalDataTransferProvider';
import Company from 'App/Models/Company/Company';
import {CreateOrUpdateBookingPayload} from 'App/Validators/Booking/BookingValidator';
import BookingPayment from 'App/Models/Booking/BookingPayment';

export default class Booking extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public did: string;

  @column()
  public name: string | null;

  @column()
  public description: string | null;

  @column()
  public guid: string;

  @column({serializeAs: null})
  public customerId: number;

  @column({serializeAs: null})
  public productId: number;

  @column()
  public recurrence: object | null;

  @column({serializeAs: 'bookingDuration'})
  public bookingDuration: number;

  @column({serializeAs: 'bookingVolume'})
  public bookingVolume: number;

  @column({serializeAs: 'schedulePrice'})
  public schedulePrice: number;

  @column()
  public metadata: { [key: string]: any } | null;

  @column({serializeAs: null})
  public createdById: number;

  @column({serializeAs: null})
  public companyId: number;

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
  @hasMany(() => BookingSchedule)
  public schedules: HasMany<typeof BookingSchedule>;

  @belongsTo(() => Customer)
  public customer: BelongsTo<typeof Customer>;

  @belongsTo(() => Product)
  public service: BelongsTo<typeof Product>;

  @belongsTo(() => User, {foreignKey: 'createdById'})
  public createdBy: BelongsTo<typeof User>;

  @belongsTo(() => Company)
  public company: BelongsTo<typeof Company>;

  @hasMany(() => BookingPayment)
  public payments: HasMany<typeof BookingPayment>;

  /**
   * Hooks
   * -------------------------------------------------------------------------------------------------------------------
   */
  @afterSave()
  public static async completeData (booking: Booking) {
    let changed = false;

    // Set up the booking display id  (did)
    if (!booking.did) {
      booking.did = 'BOK' + ((booking.id + 1000).toString(16)).toUpperCase();
      changed = true;
    }

    // Set up the guid
    if (!booking.guid) {
      booking.guid = booking.id + randomUUID();
      changed = true;
    }

    if (changed) {
      await booking.save();
    }
  }

  /**
   * Methods
   * -------------------------------------------------------------------------------------------------------------------
   */
  /**
   * Create a new booking
   */
  public static async createOrUpdateBooking (payload: CreateOrUpdateBookingPayload, companyId: number, createdById: number): Promise<SendDataReturn> {
    try {
      // Set customer id
      const customer = await Customer.query().where('did', payload.customerDid).first();
      if (!customer) {
        return sendData(null, 404, 'Customer not found');
      }

      // Set service id
      const product = await Product.query().where('did', payload.serviceDid).first();
      if (!product) {
        return sendData(null, 404, 'Service not found');
      }

      let booking: Booking | null = null;
      // Check if the booking guid is provided and the booking exists
      if (payload.guid) {
        booking = await Booking.query().where('guid', payload.guid).first();
      } else {
        if (!payload.bookingVolume || !payload.schedulePrice) {
          return sendData(null, 400, 'Booking volume and schedule price are required to create a new booking');
        }
        booking = new Booking();
        booking.customerId = customer.id;
        booking.productId = product.id;
        booking.bookingDuration = payload.bookingDuration >= 15 ? payload.bookingDuration : 15;
        booking.bookingVolume = payload.bookingVolume;
        booking.schedulePrice = payload.schedulePrice;
        booking.createdById = createdById;
        booking.companyId = companyId;
      }

      if (!booking) {
        return sendData(null, 404, 'Booking not found');
      }

      booking.name = payload.name || product.name;
      booking.description = payload.description || null;
      await booking.save();

      // Create the schedule
      const scheduleCreateResponse = await BookingSchedule.createOrUpdateBookingSchedule({
        bookingGuid: booking.guid,
        bookingSchedules: payload.bookingSchedules,
      });

      if (scheduleCreateResponse.code !== 200) {
        return sendData(scheduleCreateResponse);
      }

      return sendData(booking);
    } catch (error) {
      console.log(error);
      ExceptionHandler.report(error);
      return sendData(null, 500, error);
    }
  }
}
