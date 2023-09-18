import { BaseTask } from 'adonis5-scheduler/build';
import ExceptionHandler from 'App/Exceptions/Handler';
import moment from 'moment/moment';
import User from 'App/Models/User';

export default class ResetPasswordTokenFlushJob extends BaseTask {
  public static get schedule () {
    return '*/10 * * * *'; // Check every 10 minutes
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
      // Check and remove password reset token that is not validated after 30 minutes
      const time30MinsBefore = moment().subtract(30, 'minutes').toISOString();
      await User.query()
        .where('updatedAt', '<', time30MinsBefore)
        .whereNotNull('passwordResetToken')
        .update({passwordResetToken: null, passwordResetTokenValidated: false});
    } catch (error) {
      ExceptionHandler.report(error);
    }
  }
}
