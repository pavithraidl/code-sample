import {rules, schema} from '@ioc:Adonis/Core/Validator';
import {BookingPaymentMethod} from 'App/Models/Booking/BookingPayment';

/**
 * CREATE
 * ---------------------------------------------------------------------------------------------------------------------
 */
interface CreateBookingPaymentPayload {
  bookingGuid: string;
  paymentMethod: BookingPaymentMethod;
  sessionCount: number;
  quantityPerSession: number;
  sessionPrice: number;
  totalPrice: number;
  paid: boolean;
  paymentNotes?: string | null;
  companyDid?: string | null;
}
const createOrUpdateBookingPaymentModelSchema = schema.create({
  bookingGuid: schema.string({trim: true}, [rules.required(), rules.exists({table: 'bookings', column: 'guid'})]),
  paymentMethod: schema.enum(['AT_COUNTER', 'SEND_INVOICE', 'ONLINE', 'BANK_TRANSFER'] as const),
  sessionCount: schema.number([rules.required(), rules.range(1, 1000)]),
  quantityPerSession: schema.number([rules.required(), rules.range(1, 1000)]),
  sessionPrice: schema.number([rules.required(), rules.range(1, 100000000)]),
  totalPrice: schema.number([rules.required(), rules.range(1, 100000000)]),
  paid: schema.boolean.optional(),
  paymentNotes: schema.string.optional({trim: true}, [rules.maxLength(1000)]),
  companyDid: schema.string.optional({trim: true}, [rules.exists({table: 'companies', column: 'did'})]),
} as {[P in keyof CreateBookingPaymentPayload]: any});

export {
  CreateBookingPaymentPayload,
  createOrUpdateBookingPaymentModelSchema,
};
