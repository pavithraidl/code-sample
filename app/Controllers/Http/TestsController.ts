import ReminderSms from 'App/Services/ReminderSms';

export default class TestsController {
  public async test () {
    try {
      const smsReminder = new ReminderSms();
      smsReminder.handle();
    } catch (error) {
      console.log(error);
    }
  }
}
