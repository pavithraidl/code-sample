import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import {compose} from '@poppinss/utils/build/src/Helpers';
import {SoftDeletes} from '@ioc:Adonis/Addons/LucidSoftDeletes';

export default class AuthClient extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public uid: string;

  @column()
  public name: string;

  @column()
  public description: string;

  @column()
  public authSecret: string;

  @column()
  public allowedOrigins: string;

  @column()
  public allowedIps: string;

  @column()
  public allowedMethods: string;

  @column()
  public metaData: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column.dateTime({ columnName: 'deleted_at' })
  public deletedAt: DateTime | null;
}
