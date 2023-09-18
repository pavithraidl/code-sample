import { Server } from 'socket.io';
import AdonisServer from '@ioc:Adonis/Core/Server';
import Env from '@ioc:Adonis/Core/Env';
import AuthClient from 'App/Models/Auth/AuthClient';

class Ws {
  public io: Server;
  private booted = false;

  public async boot () {
    /**
     * Ignore multiple calls to the boot method
     */
    if (this.booted) {
      return;
    }

    this.booted = true;
    this.io = new Server(AdonisServer.instance!, {
      cors: {
        origin: Env.get('APP_ENV', 'production') === 'local' ? '*' : AuthClient.connection().clientUrl,
        credentials: true,
      },
      transports: ['websocket'],
    });
  }
}

export default new Ws();
