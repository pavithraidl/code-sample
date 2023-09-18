import BaseController from 'App/Controllers/Http/BaseController';
import {HttpContextContract} from '@ioc:Adonis/Core/HttpContext';
import Company from 'App/Models/Company/Company';
import Booking from 'App/Models/Booking/Booking';
import {
  checkAvailabilityModelSchema,
  createOrUpdateBookingOrUpdateModelSchema, listBookingModelSchema,
} from 'App/Validators/Booking/BookingValidator';
import BookingAvailability from 'App/Services/Booking/BookingAvailability';
import modelSelectionQueries from 'Config/model-selection-queries';

export default class BookingController extends BaseController {
  /**
   * List bookings
   */
  public async list ({request}: HttpContextContract) {
    try {
      // Validate the request
      const payload = await request.validate({ schema: listBookingModelSchema });

      // Set the company ID
      let companyId: number | null = null;
      if (payload.companyDid) {
        if (!await request.access.checkCompanyAccess(payload.companyDid)) {
          return this.sendResponse({error: 'Provided company does not exists or you do not have permission access it!'}, 401);
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

      // Get the bookings
      const bookings = await Booking.query()
        .select('bookings.*')
        .leftJoin('booking_schedules as bs', 'bookings.id', 'bs.booking_id')
        .where('companyId', companyId)
        .groupBy('bookings.id')
        .orderByRaw('CASE WHEN MIN(bs.booking_start) >= CURRENT_DATE THEN 1 ELSE 2 END, MIN(bs.booking_start)')
        .preload('customer', (query) => modelSelectionQueries.customer.getBasic(query))
        .preload('service', (query) => modelSelectionQueries.product.getBasic(query))
        .preload('schedules', (query) => {
          query
            .select(['bookingId', 'id', 'calendarEvent'])
            .orderByRaw('CASE WHEN booking_start >= CURRENT_DATE THEN 1 ELSE 2 END, booking_start');
        })
        .paginate(payload.page, payload.itemsPerPage || 25);

      return this.sendResponse({data: bookings});
    } catch (error) {
      return this.sendResponse({error}, 500);
    }
  }

  /**
   * Create Or Update Booking
   *
   * @param request
   * @param auth
   */
  public async createOrUpdate ({request, auth}: HttpContextContract) {
    try {
      // Validate the request
      const payload = await request.validate({ schema: createOrUpdateBookingOrUpdateModelSchema });

      // Set the company ID
      let companyId: number | null = null;

      // Set created by user ID
      const createdById = auth.user?.id || null;
      if (!createdById) {
        return this.sendResponse({error: 'Unauthorized.'}, 401);
      }

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

      // Create a booking
      const bookingCreateResponse = await Booking.createOrUpdateBooking(payload, companyId, createdById);

      // Return the error if the booking was not created
      if (bookingCreateResponse.code !== 200) {
        return this.sendResponse(bookingCreateResponse);
      }

      // load the other booking data
      const returnBooking = bookingCreateResponse.data;
      await returnBooking.load('customer');
      await returnBooking.load('service');
      await returnBooking.load('schedules');

      return this.sendResponse({data: returnBooking});
    } catch (error) {
      return this.sendResponse({error}, 500);
    }
  }

  /**
   * Show booking
   */
  public async show ({params, request}: HttpContextContract) {
    try {
      const {did} = params;

      // Get the booking
      const booking = await Booking.query()
        .where('did', did)
        .orWhere('guid', did)
        .preload('customer')
        .preload('service')
        .preload('schedules', (query) => {
          query.orderByRaw('CASE WHEN booking_start >= CURRENT_DATE THEN 1 ELSE 2 END, booking_start');
        })
        .first();

      // Check if the booking exists
      if (!booking) {
        return this.sendResponse({error: 'Booking not found!'}, 404);
      }

      // Check company access
      if (!await request.access.checkCompanyAccess(booking.companyId)) {
        return this.sendResponse({error: 'Provided company does not exists or you do not have permission access it!'}, 404);
      }

      return this.sendResponse({data: booking});
    } catch (error) {
      return this.sendResponse({error}, 500);
    }
  }

  /**
   * Check availabilities
   */
  public async checkAvailability ({request}: HttpContextContract) {
    try {
      // Validate the request
      const payload = await request.validate({ schema: checkAvailabilityModelSchema });

      // Check availabilities
      return this.sendResponse(await BookingAvailability.checkAvailability(payload));
    } catch (error) {
      return this.sendResponse({error}, 500);
    }
  }
}
