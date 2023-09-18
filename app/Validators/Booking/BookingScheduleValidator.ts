import {rules, schema} from '@ioc:Adonis/Core/Validator';
import {BookingSchedulePaymentMethod, BookingScheduleStatus} from 'App/Models/Booking/BookingSchedule';

/**
 * CREATE
 * ---------------------------------------------------------------------------------------------------------------------
 */
interface CreateOrUpdateBookingSchedule {
  guid?: string | null;
  bookingStart: string;
  bookingEnd: string;
  paymentMethod: BookingSchedulePaymentMethod;
  name?: string | null;
  status?: BookingScheduleStatus | null;
  notes?: string | null;
  isPaid?: boolean;
}
interface CreateOrUpdateBookingSchedulePayload {
  bookingGuid: string;
  bookingSchedules: Array<CreateOrUpdateBookingSchedule>;
}
const createOrUpdateBookingScheduleModelSchema = schema.create({
  bookingGuid: schema.string({}, [rules.required()]),
  bookingSchedules: schema.array().members(schema.object().members({
    guid: schema.string.nullableAndOptional(),
    bookingStart: schema.string({}, [rules.required()]),
    bookingEnd: schema.string({}, [rules.required()]),
    paymentMethod: schema.enum.optional(['AT_COUNTER', 'SEND_INVOICE', 'BANK_TRANSFER', 'ONLINE_BOOKING', 'OTHER'] as const),
    name: schema.string.nullableAndOptional({}, [rules.maxLength(32)]),
    status: schema.enum.nullableAndOptional(['DRAFT', 'PENDING', 'ACTIVE', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const),
    notes: schema.string.nullableAndOptional({}, [rules.maxLength(255)]),
    isPaid: schema.boolean.optional(),
  })),
} as {[P in keyof CreateOrUpdateBookingSchedulePayload]: any});

/**
 * LIST
 * ---------------------------------------------------------------------------------------------------------------------
 */
interface ListBookingSchedulePayload {
  from: string | null;
  to: string | null;
  assigneeDid?: string | null;
  customerDid?: string | null;
  serviceDid?: string | null;
}

const listBookingScheduleModelSchema = schema.create({
  from: schema.string({}, [rules.required()]),
  to: schema.string({}, [rules.required()]),
  assigneeDid: schema.string.nullableAndOptional(),
  customerDid: schema.string.nullableAndOptional(),
  serviceDid: schema.string.nullableAndOptional(),
} as {[P in keyof ListBookingSchedulePayload]: any});

export {
  createOrUpdateBookingScheduleModelSchema,
  CreateOrUpdateBookingSchedulePayload,
  CreateOrUpdateBookingSchedule,
  ListBookingSchedulePayload,
  listBookingScheduleModelSchema,
};
