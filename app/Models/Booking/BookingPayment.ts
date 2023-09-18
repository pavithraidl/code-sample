import { DateTime } from 'luxon';
import {BaseModel, BelongsTo, belongsTo, column, HasMany, hasMany} from '@ioc:Adonis/Lucid/Orm';
import Booking from 'App/Models/Booking/Booking';
import BookingSchedule from 'App/Models/Booking/BookingSchedule';
import {CreateBookingPaymentPayload} from 'App/Validators/Booking/BookingPaymentValidator';
import ExceptionHandler from 'App/Exceptions/Handler';
import sendData from '@ioc:App/Helpers/SendData';
import {SendDataReturn} from '../../../providers/InternalDataTransferProvider';
import PayInvoice from 'App/Services/StripePay/PayInvoice';
import EmailBookingUpdates from 'App/Mailers/Booking/EmailBookingUpdates';

export type BookingPaymentMethod = 'AT_COUNTER' | 'SEND_INVOICE' | 'ONLINE' | 'BANK_TRANSFER';
export type BookingPaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export default class BookingPayment extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({ serializeAs: null})
  public bookingId: number;

  @column({ serializeAs: 'paymentMethod'})
  public paymentMethod: BookingPaymentMethod;

  @column({ serializeAs: null})
  public stripeCustomerId: string | null;

  @column({ serializeAs: null})
  public stripeInvoiceId: string | null;

  @column({ serializeAs: 'paymentLink'})
  public paymentLink: string | null;

  @column({serializeAs: 'invoicePdfUrl'})
  public invoicePdfUrl: string | null;

  @column({serializeAs: 'sessionCount'})
  public sessionCount: number;

  @column({serializeAs: 'quantityPerSession'})
  public quantityPerSession: number;

  @column({serializeAs: 'sessionPrice'})
  public sessionPrice: number;

  @column({ serializeAs: 'totalPrice'})
  public totalPrice: number;

  @column()
  public currency: string;

  @column()
  public paid: boolean;

  @column({serializeAs: 'receiptUrl'})
  public receiptUrl: string | null;

  @column()
  public status: BookingPaymentStatus;

  @column.dateTime({ serializeAs: 'paidAt' })
  public paidAt: DateTime | null;

  @column({serializeAs: 'paymentNotes'})
  public paymentNotes: string | null;

  @column({ serializeAs: null})
  public companyId: number;

  @column({ serializeAs: null})
  public createdById: number | null;

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

  @hasMany(() => BookingSchedule)
  public bookingSchedules: HasMany<typeof BookingSchedule>;

  /**
   * Methods
   * -------------------------------------------------------------------------------------------------------------------
   */
  /**
   * Create a new booking payment
   *
   * @param createBookingPaymentPayload
   * @param companyId
   * @param createdById
   */
  public static async createBookingPayment (createBookingPaymentPayload: CreateBookingPaymentPayload, companyId: number, createdById: number | null): Promise<SendDataReturn<BookingPayment | null>> {
    try {
      const booking = await Booking.query().preload('customer').where('guid', createBookingPaymentPayload.bookingGuid).first();
      if (!booking) {
        return sendData(null, 404, 'Booking not found');
      }

      const shouldSetAsPaid = createBookingPaymentPayload.paymentMethod !== 'SEND_INVOICE' && createBookingPaymentPayload.paid;

      const bookingPayment = new BookingPayment();
      bookingPayment.bookingId = booking.id;
      bookingPayment.paymentMethod = createBookingPaymentPayload.paymentMethod;
      bookingPayment.sessionCount = createBookingPaymentPayload.sessionCount;
      bookingPayment.quantityPerSession = createBookingPaymentPayload.quantityPerSession;
      bookingPayment.sessionPrice = createBookingPaymentPayload.sessionPrice;
      bookingPayment.totalPrice = createBookingPaymentPayload.totalPrice;
      bookingPayment.stripeCustomerId = booking.customer.stripeCustomerId;
      bookingPayment.paid = shouldSetAsPaid;
      bookingPayment.status = shouldSetAsPaid ? 'COMPLETED' : 'PENDING';
      bookingPayment.paidAt = shouldSetAsPaid ? DateTime.now() : null;
      bookingPayment.paymentNotes = createBookingPaymentPayload.paymentNotes || null;
      bookingPayment.companyId = companyId;
      bookingPayment.createdById = createdById;
      await bookingPayment.save();

      // Set the stripe invoice and mark as paid if the payment method is not SEND_INVOICE else send the invoice to the customer
      if (createBookingPaymentPayload.paymentMethod === 'SEND_INVOICE' || shouldSetAsPaid) {
        const invoiceResponse = await PayInvoice.create(bookingPayment);
        if (invoiceResponse.data) {
          // Set the booking schedule payment info
          const setBookingSchedulePaymentInfo = await BookingSchedule.updatePaymentInfo(invoiceResponse.data);
          if (!setBookingSchedulePaymentInfo.data) {
            throw new Error('Failed to set payment info for booking schedule');
          }
        }

        new EmailBookingUpdates(booking.customer, booking, 'booking:invoiced').send();

        return sendData(invoiceResponse);
      }

      return sendData(bookingPayment);
    } catch (error) {
      ExceptionHandler.report(error);
      return sendData(null, 500, error.message);
    }
  }
}
