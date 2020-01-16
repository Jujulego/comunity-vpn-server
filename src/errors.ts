import { Response } from 'express';

// Alias
declare type ErrorNames = 'BadRequest' | 'Unauthorized' | 'Forbidden' | 'NotFound' | 'ServerError'
declare type ErrorGenerator = (msg?: string) => Response;

// Functions
function generator(res: Response, code: number, default_msg: string): ErrorGenerator {
  return (msg?: string) => res.status(code).send({ error: msg || default_msg });
}

export function httpError(res: Response): Record<ErrorNames, ErrorGenerator> {
  return {
    BadRequest:   generator(res, 400, 'Bad Request'),
    Unauthorized: generator(res, 401, 'Unauthorized'),
    Forbidden:    generator(res, 403, 'Forbidden'),
    NotFound:     generator(res, 404, 'Not Found'),
    ServerError:  generator(res, 500, 'Server Error'),
  }
}