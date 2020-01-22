import { Request, Response, NextFunction } from 'express';

import { httpError } from 'errors';

// Middleware
export default function required(...vars: string[]) {
  return function(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if all required elements are within the body or the query
      const failed = vars.filter(v => req.body[v] === undefined);

      // Error if one is missing
      if (failed.length > 0) {
        return httpError(res).BadRequest(`Missing required parameters: ${failed.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  }
}