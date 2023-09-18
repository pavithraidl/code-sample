import Ws from 'App/Services/Web-socket/Ws';
import {base64} from '@poppinss/utils/build/src/Helpers';
import ApiToken from 'App/Models/User/ApiToken';
import moment from 'moment/moment';
import User from 'App/Models/User';
Ws.boot();

/**
 * Listen for incoming socket connections
 * - Authorize connections
 */
Ws.io.on('connection', async (socket) => {
  const {auth} = socket.handshake;

  const token = auth.token.replace('Bearer ', '');
  const parts = token.split('.');
  const tokenId = base64.urlDecode(parts[0], undefined, true);
  if (!tokenId) {
    socket.disconnect();
    return new Error('Not authorized');
  }

  const apiToken = await ApiToken.query().where('id', parseInt(tokenId)).where('expires_at', '>', moment().toISOString()).first();
  const user = await User.query().where('id', apiToken ? apiToken.userId : 0).first();

  if (!apiToken || !user) {
    socket.disconnect();
    return new Error('Not authorized');
  }

  socket.join(`wss-stream-${user.did}`);
});
