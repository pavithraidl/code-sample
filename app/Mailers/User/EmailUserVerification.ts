import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail';
import User from 'App/Models/User';
import Env from '@ioc:Adonis/Core/Env';

export default class EmailUserVerification extends BaseMailer {
  /**
   * Constructor
   *
   * @param user
   * @param verificationLink
   * @param isJustWelcome // If this is a social login, we don't need to send verification email. So then we just send a welcome email.
   */
  constructor (private user: User, private verificationLink: string, private isJustWelcome: boolean = false) {
    super();
  }

  /**
   * Email
   *
   * @param message
   */
  public prepare (message: MessageContract) {
    const appName = Env.get('APP_NAME');
    const subject = this.isJustWelcome ? `Welcome to ${appName}` : `${appName} Account Activation`;

    const verificationContent = this.isJustWelcome ? '' : '<p>To ensure the security of your account and provide you with a seamless experience, we kindly request your assistance in verifying your email address. Email verification helps us confirm that the email provided during registration is accurate and belongs to you.</p>' +
      '<p style="text-align: center;">\n' +
      ' <a class="action-button" href="'+ this.verificationLink +'">Verify Email</a>\n' +
      '</p>';
    message
      .subject(subject)
      .from('hub@newhomes.co.nz')
      .to(this.user.email)
      .htmlView('emails/newhomes',{
        greeting: this.user.firstName,
        subject: subject,
        title: 'Welcome to New Homes',
        message: `<p>Thank you for registering with ${appName}. We are excited to have you on board.</p> ${verificationContent}`,
      });
  }
}
