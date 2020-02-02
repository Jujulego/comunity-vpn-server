import { Namespace } from 'socket.io';

import { wsauth } from 'middlewares/auth';

// Setup websockets
export default function(io: Namespace) {
  // Middlewares
  io.use(wsauth);

  // Connection
  io.on('connection', socket => {
    console.log('connected !');
  });
}