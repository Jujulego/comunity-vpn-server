import { Namespace } from 'socket.io';
import validator from 'validator';

import { wsauth } from 'middlewares/auth';
import Users from 'controllers/users';

// Setup websockets
export default function(io: Namespace) {
  // Middlewares
  io.use(wsauth);

  // Add controllers
  Users.register(io);

  // Connection
  io.on('connection', async (socket) => {
    try {
      // Personal room
      const user = await socket.user();
      socket.join(user.id);

      // Events
      socket.on('register', async (room) => {
        const user = await socket.user();

        // Join rooms
        if (room === 'admin') {
          if (!user.admin) return socket.error('Unauthorized');
          socket.join('admin');
        } else if (room == user.id) {
          // Already joined !
        } else if (validator.isMongoId(room)) {
          if (!user.admin) return socket.error('Unauthorized');
          socket.join(room);
        } else {
          socket.error(`Unknown room: ${room}`);
        }
      });

      socket.on('unregister', async (room) => {
        const user = await socket.user();

        // Join rooms
        if (room === 'admin') {
          socket.leave('admin');
        } else if (room == user.id) {
          // Never leave your room !
        } else if (validator.isMongoId(room)) {
          socket.leave(room);
        } else {
          socket.error(`Unknown room: ${room}`);
        }
      });

    } catch (error) {
      console.error(error);
      socket.error(error);
    }
  });
}