import { DateTime } from 'luxon';
import {afterSave, BaseModel, BelongsTo, belongsTo, column, HasMany, hasMany} from '@ioc:Adonis/Lucid/Orm';
import Booking from 'App/Models/Booking/Booking';
import {randomUUID} from 'crypto';
import ExceptionHandler from 'App/Exceptions/Handler';
import sendData from '@ioc:App/Helpers/SendData';
import {SendDataReturn} from '../../../providers/InternalDataTransferProvider';
import {CreateOrUpdateBookingSchedulePayload} from 'App/Validators/Booking/BookingScheduleValidator';
import moment from 'moment';
import Product from 'App/Models/Product/Product';
import BookingScheduleResource from 'App/Models/Booking/BookingScheduleResource';
import {UserBasic} from 'App/Models/User';
import {CustomerBasic} from 'App/Models/Customer/Customer';
import BookingPayment from 'App/Models/Booking/BookingPayment';

export type BookingScheduleStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type BookingSchedulePaymentMethod = 'AT_COUNTER' | 'SEND_INVOICE' | 'BANK_TRANSFER' | 'ONLINE_BOOKING' | 'OTHER';
export type BookingEventType = 'SERVICE';
export type CalendarEvent = {
  id: string;
  did: string;
  bookingDuration: number;
  serviceDid: string;
  bookingGuid: string;
  title: string;
  time: { start: DateTime; end: DateTime; },
  eventType: BookingEventType;
  isEditable: boolean;
  assignedUsers: UserBasic[];
  with: CustomerBasic;
  isCustom: boolean;
  isPaid: boolean;
  status: BookingScheduleStatus;
  paymentMethod: BookingSchedulePaymentMethod;
  notes: string;
};

export default class BookingSchedule extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  public id: number;

  @column()
  public did: string;

  @column({serializeAs: null})
  public bookingId: number;

  @column()
  public productId: number;

  @column()
  public guid: string;

  @column()
  public name: string | null;

  @column.dateTime({serializeAs: 'bookingStart'})
  public bookingStart: DateTime;

  @column.dateTime({serializeAs: 'bookingEnd'})
  public bookingEnd: DateTime;

  @column({serializeAs: 'paymentMethod'})
  public paymentMethod: BookingSchedulePaymentMethod;

  @column({serializeAs: 'isPaid'})
  public isPaid: boolean;

  @column({serializeAs: 'paymentData'})
  public paymentData: { [key: string]: any } | null;

  @column({serializeAs: 'bookingPaymentId'})
  public bookingPaymentId: number | null;

  @column()
  public status: BookingScheduleStatus;

  @column()
  public notes: string | null;

  @column()
  public metadata: { [key: string]: any } | null;

  @column({serializeAs: 'calendarEvent'})
  public calendarEvent: CalendarEvent | null;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  /**
   * Relationships
   * -------------------------------------------------------------------------------------------------------------------
   */
  @belongsTo(() => Booking)
  public booking: BelongsTo<typeof Booking>;

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>;

  @hasMany(() => BookingScheduleResource)
  public bookingScheduleResources: HasMany<typeof BookingScheduleResource>;

  /**
   * Hooks
   * -------------------------------------------------------------------------------------------------------------------
   */
  @afterSave()
  public static async completeData (bookingSchedule: BookingSchedule) {
    let changed = false;

    // Set booking schedule did
    if (!bookingSchedule.did) {
      const schedulesInSameBooking = await BookingSchedule.query().where('booking_id', bookingSchedule.bookingId);
      await bookingSchedule.load('booking');
      const scheduleCount = schedulesInSameBooking.length;
      bookingSchedule.did = `${bookingSchedule.booking.did}::${scheduleCount.toString().padStart(2, '0')}`;
      changed = true;
    }

    // Set up the guid
    if (!bookingSchedule.guid) {
      bookingSchedule.guid = bookingSchedule.id + randomUUID();
      changed = true;
    }

    if (changed) {
      await bookingSchedule.save();
    }
  }

  /**
   * Methods
   * -------------------------------------------------------------------------------------------------------------------
   */
  /**
   * Create a new booking schedule or update an existing one
   */
  public static async createOrUpdateBookingSchedule (payload: CreateOrUpdateBookingSchedulePayload): Promise<SendDataReturn> {
    try {
      const booking = await Booking.query().where('guid', payload.bookingGuid).first();
      if (!booking) {
        return sendData(null, 404, 'Booking not found');
      }

      for (const scheduleData of payload.bookingSchedules) {
        let bookingSchedule: BookingSchedule | null = null;
        // If the schedule has a guid, we need to find it
        if (scheduleData.guid) {
          bookingSchedule = await BookingSchedule.query().where('guid', scheduleData.guid).first();
        }

        // If we still don't have a booking schedule, we need to create it
        if (!bookingSchedule) {
          bookingSchedule = new BookingSchedule();
        }

        if (!this.validateScheduleDates(scheduleData.bookingStart, scheduleData.bookingEnd)) {
          return sendData(null, 400, 'Invalid booking dates');
        }

        // Set the status
        let status = scheduleData.status || 'DRAFT';
        if (typeof scheduleData.status === 'undefined') {
          status = bookingSchedule.status;
        }

        // Set the payment method
        let paymentMethod = scheduleData.paymentMethod || 'AT_COUNTER';
        if (typeof scheduleData.paymentMethod === 'undefined') {
          paymentMethod = bookingSchedule.paymentMethod;
        }

        // Set is paid
        let isPaid = scheduleData.isPaid || false;
        if (typeof scheduleData.isPaid === 'undefined') {
          isPaid = bookingSchedule.isPaid;
        }

        console.log(scheduleData);
        // Set the notes
        let notes = scheduleData.notes || '';
        if (typeof scheduleData.notes === 'undefined') {
          notes = bookingSchedule.notes || '';
        }

        bookingSchedule.bookingId = booking.id;
        bookingSchedule.productId = booking.productId;
        bookingSchedule.name = bookingSchedule.name ? bookingSchedule.name : this.setName(scheduleData.bookingStart, scheduleData.name);
        bookingSchedule.bookingStart = DateTime.fromISO(scheduleData.bookingStart);
        bookingSchedule.bookingEnd = DateTime.fromISO(scheduleData.bookingEnd);
        bookingSchedule.status = status;
        bookingSchedule.notes = notes;
        bookingSchedule.paymentMethod = paymentMethod;
        bookingSchedule.isPaid = isPaid;
        await bookingSchedule.save();

        // Allocate the resources
        const resourceAllocationResponse = await BookingScheduleResource.allocate(bookingSchedule);
        if (resourceAllocationResponse.code !== 200) {
          return resourceAllocationResponse;
        }

        // Set the calendar event
        const setCalendarEventResponse = await this.createOrUpdateCalendarEvent(bookingSchedule);
        if (setCalendarEventResponse.code !== 200) {
          return setCalendarEventResponse;
        }
      }

      return sendData(true);
    } catch (error) {
      ExceptionHandler.report(error);
      return sendData(null, 500, error);
    }
  }

  /**
   * Set the name of the schedule
   *
   * @param scheduleName
   * @param bookingStart
   * @private
   */
  private static setName (bookingStart: string, scheduleName?: string | null) {
    let returnScheduleName = scheduleName;
    if (!returnScheduleName) {
      returnScheduleName = moment(bookingStart).format('DD MMM YY') + ' - Session' || 'Session';
    }
    return returnScheduleName;
  }

  /**
   * Validate the booking dates
   */
  private static validateScheduleDates (bookingStart: string, bookingEnd: string): boolean {
    const bookingStartDate = moment(bookingStart);
    const bookingEndDate = moment(bookingEnd);

    if (!bookingStartDate.isValid() || !bookingEndDate.isValid()) {
      return false;
    }

    if (bookingStartDate.isAfter(bookingEndDate)) {
      return false;
    }

    return true;
  }

  /**
   * Set the calendar event column.
   * - This is a common event that should be called every time when booking or bookingSchedule changes.
   *
   * @param bookingSchedule
   */
  public static async createOrUpdateCalendarEvent (bookingSchedule: BookingSchedule): Promise<SendDataReturn<CalendarEvent | null>> {
    try {
      // Load related customer and resources
      await bookingSchedule.load('booking', query => query.preload('customer').preload('service'));
      await bookingSchedule.load('bookingScheduleResources', query => query.preload('user'));

      // Create user list for assignedUsers
      const assignedUsers: UserBasic[] = [];
      for (const resource of bookingSchedule.bookingScheduleResources) {
        if (resource.type === 'PERSONNEL') {
          assignedUsers.push({
            did: resource.user.did,
            firstName: resource.user.firstName,
            lastName: resource.user.lastName,
            email: resource.user.email,
            avatarUrl: resource.user.avatarUrl,
            status: resource.user.status,
          });
        }
      }

      // Create CustomerBasic
      const withCustomer: CustomerBasic = {
        did: bookingSchedule.booking.customer.did,
        firstName: bookingSchedule.booking.customer.firstName,
        lastName: bookingSchedule.booking.customer.lastName,
        status: bookingSchedule.booking.customer.status,
      };

      // Create CalendarEvent object
      const calendarEvent: CalendarEvent = {
        id: bookingSchedule.guid,
        did: bookingSchedule.did,
        bookingDuration: bookingSchedule.booking.bookingDuration,
        serviceDid: bookingSchedule.booking.service.did,
        bookingGuid: bookingSchedule.booking.guid,
        title: `${bookingSchedule.did} - ${bookingSchedule.booking.service.name}`,
        time: {
          start: bookingSchedule.bookingStart,
          end: bookingSchedule.bookingEnd,
        },
        eventType: 'SERVICE',
        isEditable: !bookingSchedule.status || ['DRAFT', 'PENDING', 'ACTIVE'].includes(bookingSchedule.status),
        assignedUsers: assignedUsers,
        with: withCustomer,
        isCustom: true,
        isPaid: bookingSchedule.isPaid,
        status: bookingSchedule.status || 'DRAFT',
        paymentMethod: bookingSchedule.paymentMethod,
        notes: bookingSchedule.notes || '',
      };

      // Set the calendar event
      bookingSchedule.calendarEvent = calendarEvent;
      await bookingSchedule.save();

      return sendData(calendarEvent);
    } catch (error) {
      ExceptionHandler.report(error);
      return sendData(null, 500, error);
    }
  }

  /**
   * Update payment info
   */
  public static async updatePaymentInfo (bookingPaymentModelData: BookingPayment): Promise<SendDataReturn<boolean>> {
    try {
      // Load payment and booking data
      await bookingPaymentModelData.load('booking', (bookingQuery) => {
        bookingQuery.preload('schedules');
      });

      // get booking schedules
      const schedules = bookingPaymentModelData.booking.schedules;

      let updatedSchedulesCount = 0;
      for (const schedule of schedules) {
        if (updatedSchedulesCount >= bookingPaymentModelData.sessionCount) {
          break; // We've updated enough schedules, exit the loop.
        }
        if (['DRAFT', 'PENDING'].includes(schedule.status) && !schedule.paymentData) {
          Object.assign(schedule, {
            status: 'PENDING',
            isPaid: bookingPaymentModelData.paid,
            paymentMethod: bookingPaymentModelData.paymentMethod,
            bookingPaymentId: bookingPaymentModelData.id,
            paymentData: {
              paymentLink: bookingPaymentModelData.paymentLink,
              invoicePdfUrl: bookingPaymentModelData.invoicePdfUrl,
              isPaid: bookingPaymentModelData.paid,
              paidAt: bookingPaymentModelData.paidAt,
            },
          });

          await schedule.save();
          this.createOrUpdateCalendarEvent(schedule);
          updatedSchedulesCount++;
        }
      }
      return sendData(true);
    } catch (error) {
      ExceptionHandler.report(error);
      return sendData(false, 500, error);
    }
  }
}
