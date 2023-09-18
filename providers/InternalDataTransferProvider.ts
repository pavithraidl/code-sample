import { ApplicationContract } from '@ioc:Adonis/Core/Application';
import {ResponseCodes} from '../@types/https';

export interface SendDataReturn<T = any> {
  data: T;
  code: number;
  error: any;
}

export default class InternalDataTransferProvider {
  constructor (protected app: ApplicationContract) {}

  public register () {
    // Register your function here
    this.app.container.singleton('App/Helpers/SendData', () => {
      return (data: any, code: ResponseCodes = 200, error: any = null) => {
        return {code, data, error};
      };
    });
  }
}
