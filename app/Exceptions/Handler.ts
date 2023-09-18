/*
|--------------------------------------------------------------------------
| Http Exception Handler
|--------------------------------------------------------------------------
|
| AdonisJs will forward all exceptions occurred during an HTTP request to
| the following class. You can learn more about exception handling by
| reading docs.
|
| The exception handler extends a base `HttpExceptionHandler` which is not
| mandatory, however it can do lot of heavy lifting to handle the errors
| properly.
|
*/

import Logger from '@ioc:Adonis/Core/Logger';
import HttpExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler';
import {HttpContextContract} from '@ioc:Adonis/Core/HttpContext';
import Sentry from '@ioc:Adonis/Addons/Sentry';

// export type ExceptionLevel = 'Fatal' | 'Error' | 'Warning' | 'Log' | 'Info' | 'Debug' | 'Critical';

export default class ExceptionHandler extends HttpExceptionHandler {
  protected ignoreStatuses = [404, 422, 403, 401, 406];
  protected ignoreCodes = ['E_UNAUTHORIZED_ACCESS'];

  constructor () {
    super(Logger);
  }

  /**
   * Report the exception
   *
   * @param error
   * @param ctx
   * @param level
   */
  // @ts-ignore
  public static async report (error: any, ctx: HttpContextContract | null = null, level?: string) {
    // Set exception user model
    const userModelObject = ctx && ctx.auth && ctx.auth.user ? ctx.auth.user : undefined;
    const user = userModelObject ? {
      id: userModelObject.id.toString(),
      ip_address: ctx && ctx.request && ctx.request.ip() ? ctx.request.ip() : '',
      email: userModelObject.email,
    } : undefined;

    Sentry.captureException(error, {
      user,
    });
  }
}
