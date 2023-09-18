import {rules, schema} from '@ioc:Adonis/Core/Validator';
import {CreateOrUpdateBookingSchedule} from 'App/Validators/Booking/BookingScheduleValidator';

/**
 * LIST
 */
interface ListBookingPayload {
  companyDid?: string | null;
  page: number;
  itemsPerPage?: number;
  startIndex?: number;
  stopIndex?: number;
  // pageCount: number;
  sortBy?: string;
  // filters?: any[];
}

const listBookingModelSchema = schema.create({
  companyDid: schema.string.nullableAndOptional(),
  page: schema.number([rules.required()]),
  itemsPerPage: schema.number.optional(),
  startIndex: schema.number.optional(),
  stopIndex: schema.number.optional(),
  // pageCount: schema.number([rules.required()]),
  sortBy: schema.string.optional(),
  // filters: schema.array.optional(),
} as {[P in keyof ListBookingPayload]: any});

/**
 * CREATE
 * ---------------------------------------------------------------------------------------------------------------------
 */
interface CreateOrUpdateBookingPayload {
  guid?: string | null;
  serviceDid: string;
  customerDid: string;
  name?: string | null;
  description?: string | null;
  bookingDuration: number;
  companyDid?: string | null;
  bookingVolume?: number;
  schedulePrice?: number;
  bookingSchedules: Array<CreateOrUpdateBookingSchedule>;
}
const createOrUpdateBookingOrUpdateModelSchema = schema.create({
  guid: schema.string.nullableAndOptional(),
  serviceDid: schema.string({}, [rules.required()]),
  customerDid: schema.string({}, [rules.required()]),
  name: schema.string.nullableAndOptional({}, [rules.maxLength(32)]),
  description: schema.string.nullableAndOptional({}, [rules.maxLength(255)]),
  bookingDuration: schema.number([rules.required()]),
  companyDid: schema.string.nullableAndOptional(),
  bookingVolume: schema.number.optional(),
  schedulePrice: schema.number.optional(),
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
} as {[P in keyof CreateOrUpdateBookingPayload]: any});

/**
 * Check AVAILABILITY
 */
interface CheckAvailabilityPayload {
  serviceDid: string;
  from: string;
  to: string;
  ignoredBookingScheduleGuids?: string[] | null;
}

const checkAvailabilityModelSchema = schema.create({
  serviceDid: schema.string({}, [rules.required()]),
  from: schema.string({}, [rules.required()]),
  to: schema.string({}, [rules.required()]),
  ignoredBookingScheduleGuids: schema.array.optional().members(schema.string()),
} as {[P in keyof CheckAvailabilityPayload]: any});

export {
  createOrUpdateBookingOrUpdateModelSchema,
  CreateOrUpdateBookingPayload,
  CheckAvailabilityPayload,
  checkAvailabilityModelSchema,
  ListBookingPayload,
  listBookingModelSchema,
};
