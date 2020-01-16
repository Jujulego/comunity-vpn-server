import express, { NextFunction, Request, Response, Router } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { httpError } from './errors';
import setup_users from './routes/users';

// Prepare express app
export const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
const api = Router();
setup_users(api);

app.use("/api", api);

// Error handler
app.use(function(err: any, req: Request, res: Response, _: NextFunction) {
  if (err instanceof Error) {
    console.error(err.stack);
    return httpError(res).ServerError(err.message);
  } else {
    return httpError(res).ServerError(err);
  }
});