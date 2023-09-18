import { DateTime } from 'luxon';
import {BaseModel, BelongsTo, belongsTo, column} from '@ioc:Adonis/Lucid/Orm';
import { string } from '@ioc:Adonis/Core/Helpers';
import AuthClient from 'App/Models/Auth/AuthClient';
import moment, {Moment} from 'moment/moment';
import ExceptionHandler from 'App/Exceptions/Handler';

export default class AuthSession extends BaseModel {
  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column()
  public authClientUid: string;

  @column()
  public token: string;

  @column()
  public expireAt: DateTime | Moment;

  @belongsTo(() => AuthClient, {foreignKey: 'authClientUid', localKey: 'uid'})
  public authClient: BelongsTo<typeof AuthClient>;

  /**
   * Create a new session auth token
   *
   * @param clientUid
   * @param secret
   */
  public static async createToken (clientUid: string, secret: string) {
    try {
      const client = await AuthClient.query().where('uid', clientUid).where('authSecret', secret).first();

      // If client not exists with the given uid and secret, return forbidden!
      if (!client) {
        return {
          code: 403,
        };
      }

      const authSession = await this.create({
        authClientUid: clientUid,
        token: `${DateTime.now().toFormat('HHmmss')}${string.generateRandom(48)}`,
        expireAt: moment().add(300, 'seconds'),
      });

      return {
        data: {
          token: authSession.token,
          expireAt: authSession.expireAt,
        },
      };
    } catch (error) {
      ExceptionHandler.report(error, null, 'Error');
      ExceptionHandler.report(error, null, 'Error');
      return {
        error: error.message,
      };
    }
  }

  /**
   * Refresh the session token
   *
   * @param clientUid
   * @param sessionToken
   */
  public static async refreshToken (clientUid: string, sessionToken: string) {
    try {
      const authSession = await this.query().where('authClientUid', clientUid).where('token', sessionToken).where('expireAt', '>', moment().format('YYYY-MM-DD HH:mm:ss')).first();

      if (!authSession) {
        return {
          code: 403,
        };
      }

      authSession.token = `${DateTime.now().toFormat('HHmmss')}${string.generateRandom(48)}`;
      authSession.expireAt = moment().add(15, 'minutes');
      await authSession.save();

      return {
        data: {
          token: authSession.token,
          expireAt: authSession.expireAt,
        },
      };
    } catch (error) {
      ExceptionHandler.report(error, null, 'Error');
      return {
        error: error.message,
      };
    }
  }
}
