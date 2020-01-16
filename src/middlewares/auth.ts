import { Request, Response, NextFunction } from 'express';

import { Token } from '../data/token';
import User from '../models/user';

// Middleware
export default async function auth(req: Request, res: Response, next: NextFunction) {
  // Grab and decode token
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const data = Token.verify(token);

  // Search for corresponding user
  const user = await User.findOne({ _id: data._id, 'tokens.token': token });
  if (!user) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  req.user = user;
  req.token = new Token(token);

  return next();
}

export function onlyAdmin(req: Request, res: Response, next: NextFunction) {
  // Only admin users are authorized
  if (!req.user.admin) return res.status(403).send({ error: 'Forbidden' });
  next();
}

// Add new properties to Request
declare global {
  namespace Express {
    interface Request {
      user: import('../data/user').User
      token: import('../data/token').Token
    }
  }
}