import Env from '@ioc:Adonis/Core/Env';
import ExceptionHandler from 'App/Exceptions/Handler';
import {PlaceAutocompleteResult} from '@googlemaps/google-maps-services-js';
import {AddressObject} from 'App/Models/Common/Address';

const { Client } = require('@googlemaps/google-maps-services-js');

export default class GooglePlaces {
  /**
   * Get autocomplete results from Google Places API
   *
   * @param address
   */
  public static async getAutoComplete (address: string): Promise<PlaceAutocompleteResult[]> {
    try {
      const client = new Client({});

      const response = await client.placeAutocomplete({
        params: {
          input: address,
          key: Env.get('GOOGLE_API_KEY'),
        },
      });

      return response.data.predictions;
    } catch (error) {
      ExceptionHandler.report(error);
      return [];
    }
  }

  /**
   * Get autocomplete results from Google Places API
   *
   * @param placeId
   */
  public static async getDetails (placeId: string): Promise<AddressObject | null> {
    try {
      const client = new Client({});

      const response = await client.placeDetails({
        params: {
          place_id: placeId,
          key: Env.get('GOOGLE_API_KEY'),
        },
      });

      if (response.data.result) {
        const returnAddress: AddressObject = {
          placeId: response.data.result.place_id,
          streetNumber: '',
          formattedAddress: response.data.result.formatted_address,
          city: '',
          postalCode: '',
          country: '',
          latitude: response.data.result.geometry.location.lat,
          longitude: response.data.result.geometry.location.lng,
          addressLine1: '',
          addressLine2: null,
        };

        for (const component of response.data.result.address_components) {
          if (component.types.includes('street_number')) {
            returnAddress.streetNumber = component.long_name;
          }

          if (component.types.includes('route')) {
            returnAddress.addressLine1 = component.long_name;
          }

          if (component.types.includes('locality')) {
            returnAddress.city = component.long_name;
          }

          if (component.types.includes('postal_code')) {
            returnAddress.postalCode = component.long_name;
          }

          if (component.types.includes('country')) {
            returnAddress.country = component.long_name;
          }
        }

        return returnAddress;
      }

      return null;
    } catch (error) {
      ExceptionHandler.report(error);
      return null;
    }
  }
}
