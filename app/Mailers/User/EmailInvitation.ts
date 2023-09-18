import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail';
import User from 'App/Models/User';
import Env from '@ioc:Adonis/Core/Env';
import mail from 'Config/mail';

export default class EmailInvitation extends BaseMailer {
  /**
   * Constructor
   *
   * @param user
   * @param invitationLink
   * @param companyName
   */
  constructor (private user: User, private invitationLink: string, private companyName?: string | null) {
    super();
  }

  /**
   * Email
   *
   * @param message
   */
  public prepare (message: MessageContract) {
    const appName = Env.get('APP_NAME');
    const subject = this.companyName ? `Join ${this.companyName} Team on ${appName}` : `${appName} Join Invitation`;

    message
      .subject(subject)
      .from(mail.fromEmail, mail.fromName)
      .to(this.user.email)
      .htmlView('emails/default',{
        greeting: this.user.firstName,
        subject: subject,
        title: 'Let\'s get your new account set up',
        message: this.companyName ? `You're invited to join ${this.companyName} team on ${appName}!</p>
           <p>Simply click the accept invitation button below to create your account.
           <p style="text-align: center;"><a class="action-button" href="${this.invitationLink}">Accept Invitation</a></p>
           <p>Welcome onbard! Let's streamline our processes, enhance efficiency, and achieve excellence together.</p>`
          :
          `<p>${appName} team sent you an invitation to join with ${appName}. Please click the accept invitation below to complete your setup process.</p>
            <p style="text-align: center;">
            <a class="action-button" href="${this.invitationLink}">Accept Invitation</a>
            </p>`,
      });
  }
}
