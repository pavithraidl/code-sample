import Ws from 'App/Services/Web-socket/Ws';
import User from 'App/Models/User';
import ExceptionHandler from 'App/Exceptions/Handler';

export default class Broadcast {
  public static async push (userIds: number[], data: any, channel: string = 'update') {
    try {
      if (userIds.length > 0) {
        const users = await User.query().whereIn('id', userIds).select(['did']);
        if (Array.isArray(users)) {
          const broadcastRooms = users.map((user) => `wss-stream-${user.did}`);
          Ws.io.to(broadcastRooms).emit(channel, data);
        }
      }
    } catch (error) {
      console.log(error);
      ExceptionHandler.report(error, null, 'Error');
    }
  }
}
