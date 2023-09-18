import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail';
import User from 'App/Models/User';
import Env from '@ioc:Adonis/Core/Env';
import mail from 'Config/mail';

export default class EmailCompanyCreated extends BaseMailer {
  /**
   * Constructor
   *
   * @param user
   * @param invitationLink
   */
  constructor (private user: User, private invitationLink: string | null = null) {
    super();
  }

  /**
   * Email
   *
   * @param message
   */
  public prepare (message: MessageContract) {
    const appName = Env.get('APP_NAME');

    // Send invitation email
    // --------------------------------------------
    const subject = `Invitation to Join ${appName}`;

    message
      .subject(subject)
      .from(mail.fromEmail, mail.fromName)
      .to(this.user.email)
      .htmlView('emails/default',{
        greeting: this.user.firstName,
        subject: subject,
        title: 'Invitation to Join New Homes Hub',
        message: `<p>We are thrilled to extend an official invitation to you to become part of the ${appName} community. This personal invitation offers you the unique opportunity to directly create your company\s profile on our platform.</p>
            <p>To get started, kindly use this exclusive invitation link:</p>
            <a class="action-button" href="${this.invitationLink}">Accept Invitation</a>
            <p>This link will navigate you through the straightforward steps required to establish your company's profile.</p>
            <p>If you have any queries or need assistance at any point during the onboarding process, we encourage you to reach out to us. Our dedicated team is on standby, ready to assist and ensure you can fully exploit this opportunity.</p>
            <p>We eagerly anticipate your presence on ${appName} in the near future.</p>`,
      });
  }
}
