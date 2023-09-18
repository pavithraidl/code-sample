import { BaseTask } from 'adonis5-scheduler/build';
import ExceptionHandler from 'App/Exceptions/Handler';
import ReminderSms from 'App/Services/ReminderSms';

export default class ReminderSmsJob extends BaseTask {
  public static get schedule () {
    return '0 * * * *'; // Run every hour
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
      const smsReminder = new ReminderSms();
      smsReminder.handle();
    } catch (error) {
      ExceptionHandler.report(error);
    }
  }
}
