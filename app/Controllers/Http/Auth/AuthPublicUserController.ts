/**
 * AuthPublicUserController
 * ---------------------------------------------------------------------------------------------------------------------
 * @description This controller is responsible for handling the public user authorization requests. This api is designed
 * - to have admin panel users and public users (most of the cases the users from the frontend website).
 */
import BaseController from 'App/Controllers/Http/BaseController';
import {HttpContextContract} from '@ioc:Adonis/Core/HttpContext';
import User from 'App/Models/User';
import Hash from '@ioc:Adonis/Core/Hash';
import EmailResetPasswordLink from 'App/Mailers/User/EmailResetPasswordLink';
import {randomUUID} from 'crypto';
import Env from '@ioc:Adonis/Core/Env';
import UserLoginLog from 'App/Models/User/UserLoginLog';
import Log from 'App/Models/Log/Log';
import recaptchaValidate from 'App/Services/recaptchaValidate';
import EmailUserVerification from 'App/Mailers/User/EmailUserVerification';
import modelSelectionQueries from 'Config/model-selection-queries';
import {
  loginPublicAuthUser,
  registerPublicAuthUser,
  updatePublicAuthUser,
} from 'App/Validators/User/AuthPublicUserValidator';

export default class AuthUserController extends BaseController {
  /**
   * Register a new user
   *
   * @param request
   * @param auth
   */
  public async register ({ request }: HttpContextContract) {
    try {
      // Validate request body
      const payload = await request.validate({ schema: registerPublicAuthUser });

      // Manual validation for password and socialLoginData
      if (!payload.password && !payload.socialLoginData) {
        this.sendResponse({ error: 'Either password or socialLoginData is required', code: 403 });
      }

      // Validate recaptcha (Ignore if local)
      if (Env.get('APP_ENV') !== 'local') {
        const recaptchaValidated = await recaptchaValidate(payload.token);
        if (!recaptchaValidated) {
          return this.sendResponse({error: 'Unable to verify user'},407);
        }
      }

      // Check if the email is already registered
      const existingUser = await User.query().where('email', payload.email).first();
      if (existingUser) {
        const existingUserSocialLogin = existingUser.socialLoginData.data.find((socialLoginData) => socialLoginData.provider === (payload.socialLoginData as any)?.provider);
        if (payload.socialLoginData && existingUserSocialLogin && payload.socialLoginData.token === existingUserSocialLogin.token) {
          // User email already registered and social login data is present
          return this.sendResponse({data: 'Proceed with social login'},201);
        } else if (payload.socialLoginData && !existingUserSocialLogin) {
          // User registered with this email. But not with social login data. So, let's save social login data
          existingUser.socialLoginData.data = [...existingUser.socialLoginData.data, payload.socialLoginData];
          existingUser.status = 'ACTIVE';
          await existingUser.save();
          return this.sendResponse({data: 'Proceed with social login'},201);
        }
        return this.sendResponse({error: 'Email already registered'},406);
      }

      // set password as a random string if socialLoginData is present
      const password: string = payload.socialLoginData ? randomUUID() : (payload.password as string);

      // Create user
      const user = new User();
      user.firstName = payload.firstName;
      user.lastName = payload.lastName;
      user.email = payload.email.toLowerCase();
      user.password = await Hash.make(password);
      user.roleId = 9;
      user.socialLoginData = {data: payload.socialLoginData ? [payload.socialLoginData] : []};
      user.avatarUrl = payload.avatarUrl || null;
      user.status = payload.socialLoginData ? 'ACTIVE' : 'PENDING';
      await user.save();

      // Send activation email if password login or send welcome email if social login
      const verificationLink = `${Env.get('WEB_URL')}/auth/verify-email/${user.guid}`;
      await new EmailUserVerification(user, verificationLink, !!(payload.socialLoginData)).send();

      // If this is a social login, ask frontend to proceed with social login
      if (payload.socialLoginData) {
        return this.sendResponse({data: 'Proceed with social login'},201);
      }

      return this.sendResponse({data: 'Created!'});
    } catch (error) {
      console.log(error);
      return this.sendResponse({error: error}, 500);
    }
  }

  /**
   * Login user (generate a Bearer token)
   *
   * @param request
   * @param auth
   */
  public async login ({ request, auth }: HttpContextContract) {
    try {
      // Validate request body
      const payload = await request.validate({ schema: loginPublicAuthUser });

      // Manual validation for password and socialLoginData
      if (!payload.password && !payload.socialLoginData) {
        this.sendResponse({ error: 'Either password or socialLoginData is required', code: 403 });
      }

      // Validate recaptcha (Ignore if local)
      if (Env.get('APP_ENV') !== 'local') {
        const recaptchaValidated = await recaptchaValidate(payload.token);
        if (!recaptchaValidated) {
          return this.sendResponse({error: 'Unable to verify user'},407);
        }
      }

      const user = await User.query().where('email', payload.email.toLowerCase()).first();

      // If user is not found
      if (!user) {
        return this.sendResponse({error: 'Not found'}, 404);
      }

      // Generate a token
      const token = await auth.use('api').generate(user, {expiresIn: '1 year'});

      if (payload.socialLoginData && !!payload.socialLoginData.token) {
        // Get user social login data related to this provider
        const userSocialLoginData = user.socialLoginData.data.find((socialLoginData) => socialLoginData.provider === (payload.socialLoginData as any).provider);
        // const userSocialLoginData = user.socialLoginData.
        if (userSocialLoginData && userSocialLoginData.token === payload.socialLoginData.token) {
          // Social login success. Return the auth token.
          return this.sendResponse({data: token});
        } else {
          return this.sendResponse({error: 'Invalid credentials'}, 401);
        }
      }

      // If user account is pending.
      if (user.status === 'PENDING') {
        return this.sendResponse({data: 'Unauthorized!', error: 'Activation pending!'}, 405);
      }

      // Verify credentials
      if (!user || !(await Hash.verify(user.password, payload.password as string))) {
        return this.sendResponse({error: 'Invalid credentials'}, 401);
      }

      // Handle user status
      switch (user.status) {
        case 'DISABLED':
          return this.sendResponse({data: 'Unauthorized!', error: 'Disabled!'}, 406);
        case 'SUSPENDED':
          return this.sendResponse({data: 'Unauthorized!', error: 'Suspended!'}, 401);
      }

      if (payload.clientIp) {
        // Log user login details
        UserLoginLog.logRequest(user.id, request, payload.clientIp);
      }

      return this.sendResponse({data: token});
    } catch (error) {
      console.log(error);
      return this.sendResponse({error: error}, 500);
    }
  }

  /**
   * Activate user account
   *
   * @param auth
   */
  public async activateAccount ({request}: HttpContextContract) {
    try {
      const {guid} = request.all();

      if (!guid) {
        return this.sendResponse({error: 'Not found'}, 404);
      }

      const user = await User.query().where('guid', guid).where('status', 'PENDING').first();
      if (!user) {
        return this.sendResponse({error: 'Not found'}, 404);
      }

      user.status = 'ACTIVE';
      await user.save();

      return this.sendResponse({data: 'Account activated!'});
    } catch (error) {
      console.log(error);
      return this.sendResponse({error: 'Unauthorized'}, 401);
    }
  }

  /**
   * Request password reset link
   *
   * @param request
   */
  public async requestPasswordResetLink ({request}: HttpContextContract) {
    try {
      const email = request.input('email');
      if (!email) {
        return this.sendResponse({error: 'Email is required'}, 406);
      }

      // Validate recaptcha
      const recaptchaValidated = await recaptchaValidate(request.input('token'));
      if (!recaptchaValidated) {
        return this.sendResponse({error: 'Unable to verify user'},407);
      }

      // Lookup user by email address
      const user = await User.query().where('email', email.toLowerCase()).where('status', 'ACTIVE').first();

      // If user exists send the password reset email
      if (user) {
        const passwordResetToken = user.guid + randomUUID();
        user.passwordResetToken = passwordResetToken;
        user.passwordResetTokenValidated = false;
        user.save();

        setTimeout(() => {
          user.passwordResetToken = null;
          user.passwordResetTokenValidated = false;
          user.save();
        }, 1000 * 60 * 30);

        Log.record('requested password reset link', {relatedModel: 'User', type: 'WARNING', createdBy: user.id});

        const resetLink = `${Env.get('WEB_URL')}/auth/reset-password/${passwordResetToken}`;
        await new EmailResetPasswordLink(user, resetLink).send();
      }

      return this.sendResponse({data: 'Sent!'});
    } catch (error) {
      return this.sendResponse({error: error}, 500);
    }
  }

  /**
   * Reset the password
   *
   * @param request
   */
  public async resetPassword ({request}: HttpContextContract) {
    try {
      const token = request.input('token');
      const resetToken = request.input('resetToken');
      const password = request.input('password');

      // Validate recaptcha
      const recaptchaValidated = await recaptchaValidate(token);
      if (!recaptchaValidated) {
        return this.sendResponse({error: 'Unable to verify user'},407);
      }

      // Lookup user by email address
      const user = await User.query().where('password_reset_token', resetToken).first();

      // If user exists reset the password
      if (user) {
        user.password = await Hash.make(password);
        user.passwordResetToken = null;
        user.passwordResetTokenValidated = false;
        user.save();

        Log.record('reset password', {relatedModel: 'User', type: 'WARNING', createdBy: user.id});
        return this.sendResponse({data: 'Password changed!'});
      }

      return this.sendResponse({error: 'Invalid token!'}, 406);
    } catch (error) {
      return this.sendResponse({error: error}, 500);
    }
  }

  /**
   * Get user data
   *
   * @param auth
   */
  public async show ({auth}: HttpContextContract) {
    try {
      if (!auth.user) {
        return this.sendResponse({error: 'Not found'}, 404);
      }

      const user = await User.query().where('id', auth.user?.id).select(modelSelectionQueries.user.basic).first();
      if (!user) {
        return this.sendResponse({error: 'Not found'}, 404);
      }

      return this.sendResponse({data: user});
    } catch (error) {
      return this.sendResponse({error: error}, 500);
    }
  }

  /**
   * Update user data
   */
  public async update ({request, auth}: HttpContextContract) {
    try {
      if (!auth.user) {
        return this.sendResponse({error: 'Not found'}, 404);
      }

      // Validate request body
      const payload = await request.validate({ schema: updatePublicAuthUser });

      const user = await User.query().where('id', auth.user?.id).first();
      if (!user) {
        return this.sendResponse({error: 'Not found'}, 404);
      }

      let avatarUrl: string | null = payload.avatarUrl || null;
      if (!avatarUrl) {
        avatarUrl = user.avatarUrl;
      }

      let phoneNumber = payload.phoneNumber || null;
      if (!phoneNumber) {
        phoneNumber = user.phoneNumber;
      }

      user.firstName = payload.firstName;
      user.lastName = payload.lastName;
      user.avatarUrl = avatarUrl;
      user.phoneNumber = phoneNumber;
      await user.save();

      const returnUser = await User.query().where('id', user.id).select(modelSelectionQueries.user.basic).first();
      return this.sendResponse({data: returnUser});
    } catch (error) {
      return this.sendResponse({error: error}, 500);
    }
  }

  /**
   * Logout the user (Revoke the Bearer token)
   *
   * @param auth
   */
  public async logout ({auth}) {
    try {
      await auth.use('api').revoke();

      return this.sendResponse({data: 'Token revoked!'});
    } catch (error) {
      return this.sendResponse({error: error}, 500);
    }
  }
}
