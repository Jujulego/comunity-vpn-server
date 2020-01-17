import { Request, Response, NextFunction } from 'express';

import { Token, verifyToken } from '../data/token';
import { httpError } from '../errors';
import User from '../models/user';

// Add new properties to Request
declare global {
  namespace Express {
    interface Request {
      user: import('../data/user').User
      token: Token
    }
  }
}

// Middleware
export default async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    // Grab and decode token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return httpError(res).Unauthorized();
    }

    const data = verifyToken(token);

    // Search for corresponding user
    const user = await User.findOne({ _id: data._id, 'tokens.token': token });
    if (!user) {
      return httpError(res).Unauthorized();
    }

    req.user = user;
    req.token = user.tokens.find(tk => tk.token == token) as Token;

    return next();
  } catch (error) {
    next(error);
  }
}

export function onlyAdmin(req: Request, res: Response, next: NextFunction) {
  // Only admin users are authorized
  if (!req.user.admin) return httpError(res).Forbidden();
  next();
}