import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail';
import User from 'App/Models/User';
import mail from 'Config/mail';

export default class EmailResetPasswordLink extends BaseMailer {
  /**
   * Constructor
   *
   * @param user
   * @param resetLink
   */
  constructor (private user: User, private resetLink: string) {
    super();
  }

  /**
   * Email
   *
   * @param message
   */
  public prepare (message: MessageContract) {
    const subject = 'Reset Password Instruction';

    message
      .subject(subject)
      .from(mail.fromEmail, mail.fromName)
      .to(this.user.email)
      .htmlView('emails/default',{
        greeting: this.user.firstName,
        subject: subject,
        title: 'Let\'s reset your password',
        message: '<p>Please click the button below to open the reset password page.</p>' +
          '<p style="text-align: center;">\n' +
          ' <a class="action-button" href="'+ this.resetLink +'">Reset Password</a>\n' +
          '</p><p>You received this email, because we have recieved a request to send you a reset password link. If you haven\'t made the request, you can ignore this message.</p>',
      });
  }
}
