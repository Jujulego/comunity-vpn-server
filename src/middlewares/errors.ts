import { Request, Response, NextFunction } from 'express';

// Classe
export class HttpError {
  // Attributes
  readonly message: string;
  readonly code: number;

  // Constructor
  constructor(code: number, message: string) {
    this.message = message;
    this.code = code;
  }

  // Statics
  static BadRequest(  msg: string = 'Bad Request')  { return new HttpError(400, msg); }
  static Unauthorized(msg: string = 'Unauthorized') { return new HttpError(401, msg); }
  static Forbidden(   msg: string = 'Forbidden')    { return new HttpError(403, msg); }
  static NotFound(    msg: string = 'Not Found')    { return new HttpError(404, msg); }
  static ServerError( msg: string = 'Server Error') { return new HttpError(500, msg); }

  // Methods
  send(res: Response): Response {
    return res.status(this.code).send({ error: this.message });
  }
}

// Middleware
const errors = () => (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HttpError) {
    return err.send(res);
  }

  if (err instanceof Error) {
    console.error(err.stack);
    return HttpError.ServerError(err.message).send(res);
  }

  next(err);
};

export default errors;