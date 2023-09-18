import {CheckAvailabilityPayload} from 'App/Validators/Booking/BookingValidator';
import ExceptionHandler from 'App/Exceptions/Handler';
import sendData from '@ioc:App/Helpers/SendData';
import Product from 'App/Models/Product/Product';
import BookingSchedule from 'App/Models/Booking/BookingSchedule';
import moment from 'moment';
import ProductResource from 'App/Models/Product/ProductResource';
import {SendDataReturn} from '../../../providers/InternalDataTransferProvider';

export default class BookingAvailability {
  /**
   * Check service availability
   *
   * @param payload
   */
  public static async checkAvailability (payload: CheckAvailabilityPayload): Promise<any> {
    try {
      const service = await Product.query()
        .where('did', payload.serviceDid)
        .preload('resources')
        .first();
      if (!service) {
        return sendData(null, 404, 'Service not found');
      }

      const ignoredBookingScheduleGuids = payload.ignoredBookingScheduleGuids || [];

      const resourceAvailabilityPromises = service.resources.map(serviceResource =>
        this.checkResourceAvailability(serviceResource, payload.from, payload.to, ignoredBookingScheduleGuids)
      );
      const resourceAvailabilityResults = await Promise.all(resourceAvailabilityPromises);

      const overlappedResources = resourceAvailabilityResults.filter(result => result.data !== null).map(result => result.data);
      const available = overlappedResources.length === 0;

      return sendData({ available, overlappedResources });
    } catch (error) {
      ExceptionHandler.report(error);
      return sendData(null, 500, error);
    }
  }

  /**
   * Check resource availability
   *
   * @param serviceResource
   * @param from
   * @param to
   * @param ignoredBookingGuids
   */
  public static async checkResourceAvailability (serviceResource: ProductResource, from: string, to: string, ignoredBookingGuids: string[] = []): Promise<SendDataReturn> {
    try {
      const checkingFromTime = moment(from).subtract(serviceResource.preparationTime, 'minutes').format('YYYY-MM-DD HH:mm:ss');
      const checkingToTime = moment(to).add(serviceResource.finalizingTime, 'minutes').format('YYYY-MM-DD HH:mm:ss');

      const resourceDid = (serviceResource.type === 'TOOL' ? serviceResource.toolDid :
        (serviceResource.type === 'CONSUMABLE' ? serviceResource.consumableDid : null)) as string;

      const existingSchedules = await BookingSchedule.query()
        .where('bookingEnd', '>', checkingFromTime)
        .where('bookingStart', '<', checkingToTime)
        .whereNotIn('guid', ignoredBookingGuids)
        .whereHas('bookingScheduleResources', (query) => {
          query.where('type', serviceResource.type);
          if (resourceDid) {
            query.where('resourceDid', resourceDid);
          }
        }).preload('bookingScheduleResources');

      let alreadyAllocatedQuantity = 0;
      let alreadyAllocatedDids: string[] = [];
      for (const existingSchedule of existingSchedules) {
        for (const existingScheduleResource of existingSchedule.bookingScheduleResources) {
          if (existingScheduleResource.type === serviceResource.type && (resourceDid ? existingScheduleResource.resourceDid === resourceDid : true)) {
            alreadyAllocatedQuantity += (serviceResource.type === 'PERSONNEL' ? 1 : existingScheduleResource.requiredQuantity);
            alreadyAllocatedDids.push(existingScheduleResource.resourceDid);
          }
        }
      }

      const resource = resourceDid ? await Product.query().where('did', resourceDid).first() : null;

      const totalResourceQuantity = resource ? (resource.quantity || 0) : serviceResource.personnels.length;
      const availableQuantity = totalResourceQuantity - alreadyAllocatedQuantity;
      const requiredQuantity = serviceResource.requiredQuantity;

      if (availableQuantity >= requiredQuantity) {
        return sendData(null);
      }

      return sendData({
        resource: {
          did: resourceDid || null,
          name: serviceResource.name,
          heroImageUrl: resource ? resource.heroImageUrl : null,
        },
        requiredQuantity,
        alreadyAllocatedQuantity,
        alreadyAllocatedDids,
        availableQuantity,
        type: serviceResource.type,
      });
    } catch (error) {
      ExceptionHandler.report(error);
      return sendData(null, 500, error);
    }
  }
}
