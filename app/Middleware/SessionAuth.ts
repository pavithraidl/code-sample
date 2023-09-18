/**
 * Custom auth and cors middleware
 * ---------------------------------------------------------------------------------------------------------------------
 * @description This middleware is responsible for the session authentication and cors handling and also injecting the
 * access data to the request.
 */
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import AuthSession from 'App/Models/Auth/AuthSession';
import moment from 'moment/moment';
import AuthClient from 'App/Models/Auth/AuthClient';
import {RequestContract} from '@ioc:Adonis/Core/Request';
import ExceptionHandler from 'App/Exceptions/Handler';
import {RequestAccessData} from '../../@types/access';
import Company from 'App/Models/Company/Company';

export default class SessionAuth {
  private accessData: RequestAccessData = {
    roleId: 0,
    isAdmin: false,
    isSuperAdmin: false,
    isCompanyAdmin: false,
    myCompanyId: 0,
    checkCompanyAccess: async (companyIdOrDid: number | string | null) => {
      return companyIdOrDid === null && companyIdOrDid === 1;
    },
  };

  /**
   * Handle Session auth and CORS
   *
   * @param request
   * @param response
   * @param auth
   * @param next
   */
  public async handle ({request, response, auth}: HttpContextContract, next: () => Promise<void>) {
    /**
     * Run session auth
     */
    const headers = request.headers();
    const clientUid = headers['client-uid'];
    const sessionToken = headers['session-token'];

    if (clientUid && sessionToken) {
      // Get the auth session
      const authSession = await AuthSession.query().where('auth_client_uid', clientUid).where('token', sessionToken).preload('authClient').first();

      // Validate the auth session against the token and provided request origin, methods and ip
      if (authSession && moment(authSession.expireAt).isAfter(moment()) && authSession.authClient && this.handleCors(request, authSession.authClient)) {
        // Inject access data to the request
        request['access'] = this.setRequestAccessData(auth);
        await next();
        return;
      }
    }

    response.forbidden('Forbidden!');
    return;
  }

  /**
   * Set the request access data
   *
   * @param auth
   * @private
   */
  private setRequestAccessData (auth: HttpContextContract['auth']) {
    try {
      if (auth.user) {
        const roleId = auth.user.roleId || 0;
        const myCompanyId = auth.user.companyId || 0;
        this.accessData = {
          roleId: roleId,
          isAdmin: roleId < 3,
          isSuperAdmin: roleId < 2,
          isCompanyAdmin: roleId === 3,
          myCompanyId,
          checkCompanyAccess: async (companyIdOrDid: number | string | null) => {
            if (roleId < 3) {
              return true;
            } else if (typeof companyIdOrDid === 'string') {
              const company = await Company.query().where('did', companyIdOrDid).first();
              return !!(company && company.id === myCompanyId);
            } else if (typeof companyIdOrDid === 'number') {
              return companyIdOrDid === myCompanyId;
            }
            return false;
          },
        };
      }

      return this.accessData;
    } catch (error) {
      ExceptionHandler.report(error);
      return this.accessData;
    }
  }

  /**
   * Validate the request and handle the cors
   *
   * @param request
   * @param authClient
   * @private
   */
  private handleCors (request: RequestContract, authClient: AuthClient) {
    const origin = request.headers().origin;
    const method = request.method();
    const ip = request.ip();

    let allowedOrigins = authClient.allowedOrigins;
    let allowedMethods = authClient.allowedMethods;
    let allowedIps = authClient.allowedIps;

    // If allowedOrigins is not set or if set then check the validity with the request
    if (allowedOrigins && !allowedOrigins.includes('*') && !allowedOrigins.includes(origin || '')) {
      return false;
    }

    // If allowedMethods is not set or if set then check the validity with the request
    if (allowedMethods && !allowedMethods.includes('*') && !allowedMethods.includes(method)) {
      return false;
    }

    // If allowed ip not set of if set then check the validity with the request
    if (allowedIps && !allowedIps.includes('*') && !allowedIps.includes(ip)) {
      return false;
    }
    return true;
  }
}
