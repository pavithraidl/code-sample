// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';

export default class SessionAuth {
  public async handle ({}, next: () => Promise<void>) {
    /**
     * Set Under Maintenance mode
     */
    // const headers = request.headers();
    // const key = headers['access-key'];
    // if (key !== 'pavithraidl') {
    //   response.serviceUnavailable('Under maintenance!');
    //   return;
    // }

    await next();
    return;
  }
}
