import {RequestAccessData} from '../@types/access';

declare module '@ioc:Adonis/Core/Request' {
  interface RequestContract {
    access: RequestAccessData;
  }
}
