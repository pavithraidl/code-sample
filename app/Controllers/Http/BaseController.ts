import ExceptionHandler from 'App/Exceptions/Handler';
import {HttpResponse, ResponseCodes} from '../../../@types/https';

export default class BaseController {
  /**
   * Send response
   *
   * @param payload
   * @param code
   */
  public sendResponse (payload: {data?: any, error?: any, code?: any}, code: ResponseCodes = 200): HttpResponse {
    if (payload) {
      if (code === 500) {
        // Handle validation errors
        if (payload.error && payload.error.code === 'E_VALIDATION_FAILURE') {
          return {
            code: 406,
            data: null,
            error: this.formatValidationErrors(payload.error),
          };
        }
        ExceptionHandler.report(payload.error, null, 'Error');
      }

      return {
        code: payload.code || code,
        data: payload.data || null,
        error: payload.error || null,
      };
    }

    return {
      code: 406,
      data: null,
      error: 'No data received!',
    };
  }

  /**
   * Format validation errors
   *
   * @param error
   * @private
   */
  private formatValidationErrors (error: any) {
    if (error.messages && error.messages.errors) {
      return error.messages.errors;
    } else if (error.messages) {
      return error.messages;
    }
    return error;
  }
}
