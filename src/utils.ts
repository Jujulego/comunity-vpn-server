import { RequestHandler } from 'express';

// Utils
export function aroute(handler: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    try {
      return await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  }
}