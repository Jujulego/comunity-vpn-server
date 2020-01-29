import { RequestHandler } from 'express';

// Utils
export function route(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    try {
      return handler(req, res, next);
    } catch (error) {
      next(error);
    }
  }
}

export function aroute(handler: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    try {
      return await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  }
}