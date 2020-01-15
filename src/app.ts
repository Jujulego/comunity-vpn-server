import express, { Router } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

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