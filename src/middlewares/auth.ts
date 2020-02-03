import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';

import { HttpError } from 'middlewares/errors';
import { aroute } from 'utils';

import Users from 'controllers/users';
import Token from 'data/token';
import User from 'data/user';

// Add new properties to Request
declare global {
  namespace Express {
    interface Request {
      user: User
      token: Token
    }
  }

  namespace SocketIO {
    interface Socket {
      user: () => Promise<User>
    }
  }
}

// Middlewares
export default aroute(async (req: Request, res: Response, next: NextFunction) => {
  // Authenticate user
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const user = await Users.authenticate(token);

  // Store documents in request
  req.user = user;
  req.token = user.tokens.find(tk => tk.token == token) as Token;

  return next();
});

export async function wsauth(socket: Socket, next: (err?: any) => void) {
  try {
    // Authenticate user
    const { token } = socket.handshake.query;
    const user = await Users.authenticate(token);

    // Access to user from socket
    socket.user = async () => await Users.findWithToken(user._id, token);

    return next();
  } catch (error) {
    console.log(error);
    return next(error);
  }
}

export function onlyAdmin(req: Request, res: Response, next: NextFunction) {
  // Only admin users are authorized
  if (!req.user.admin) throw HttpError.Forbidden();
  next();
}