import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';

export default class SessionAuth {
  public async handle ({route, auth, response}: HttpContextContract, next: () => Promise<void>) {
    // @ts-ignore
    const {middleware} = route;
    if (Array.isArray(middleware)) {
      const middlewareText = middleware.join(' ');
      const regex = /access:(\S+)/;
      const match = middlewareText.match(regex);
      const accessCodesString = match ? match[1] : null;

      if (accessCodesString) {
        const accessCodeArray = accessCodesString.split('|');
        const user = auth.user;
        if (!user) {
          response.preconditionFailed('Unauthorized!');
          return;
        }

        await user.load('role');

        let accessGranted = false;
        if (Array.isArray(user.role.permissions.data)) {
          accessGranted = user.role.permissions.data.some(ai => accessCodeArray.includes(ai));
        }

        if (user.role.permissions.data === 'FULL' || accessGranted) {
          await next();
          return;
        }
      }
    }
    response.preconditionFailed('Unauthorized!');
    return;
  }
}
