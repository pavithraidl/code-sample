import { BaseTask } from 'adonis5-scheduler/build';
import ExceptionHandler from 'App/Exceptions/Handler';
import AuthSession from 'App/Models/Auth/AuthSession';
import moment from 'moment/moment';

export default class AuthSessionFlushJob extends BaseTask {
  public static get schedule () {
    return '* * * * *';
  }
  /**
	 * Set enable use .lock file for block run retry task
	 * Lock file save to `build/tmpTaskLock`
	 */
  public static get useLock () {
    return false;
  }

  public async handle () {
    try {
      const timeNow = moment().subtract(1, 'minutes').toISOString();
      await AuthSession.query().where('expireAt', '<', timeNow).delete();
    } catch (error) {
      ExceptionHandler.report(error);
    }
  }
}
