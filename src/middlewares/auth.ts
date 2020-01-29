import { Request, Response, NextFunction } from 'express';

import { HttpError } from 'middlewares/errors';
import { aroute } from 'utils';

import Token, { verifyToken } from 'data/token';
import User from 'models/user';

// Add new properties to Request
declare global {
  namespace Express {
    interface Request {
      user: import('../data/user').default
      token: Token
    }
  }
}

// Middleware
export default aroute(async (req: Request, res: Response, next: NextFunction) => {
  // Grab and decode token
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) throw HttpError.Unauthorized();

  const data = verifyToken(token);

  // Search for corresponding user
  const user = await User.findOne({ _id: data._id, 'tokens.token': token });
  if (!user) throw HttpError.Unauthorized();

  req.user = user;
  req.token = user.tokens.find(tk => tk.token == token) as Token;

  return next();
});

export function onlyAdmin(req: Request, res: Response, next: NextFunction) {
  // Only admin users are authorized
  if (!req.user.admin) throw HttpError.Forbidden();
  next();
}