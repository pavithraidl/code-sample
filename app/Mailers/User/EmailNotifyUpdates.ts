import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail';
import User from 'App/Models/User';
import mail from 'Config/mail';

export default class EmailNotifyUpdates extends BaseMailer {
  /**
   * Constructor
   *
   * @param user
   * @param subject
   * @param title
   * @param message
   */
  constructor (private user: User | User[], private subject: string, private title: string | null, private message: string) {
    super();
  }

  /**
   * Email
   *
   * @param message
   */
  public prepare (message: MessageContract) {
    const emails = Array.isArray(this.user) ? this.user.map(user => user.email) : this.user.email;

    for (const email of emails) {
      message
        .subject(this.subject)
        .from(mail.fromEmail, mail.fromName)
        .to(email)
        .htmlView('emails/default',{
          greeting: Array.isArray(this.user) ? '' : this.user.firstName,
          subject: this.subject,
          title: this.title,
          message: this.message,
        });
    }
  }
}
