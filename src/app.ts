import express, { Router } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import errors from 'middlewares/errors';
import setup_certificates from 'routes/certificates';
import setup_users from 'routes/users';
import setup_servers from 'routes/servers';

// Prepare express app
export const app = express();
app.set('trust proxy', true);

// Middlewares
if (process.env.NODE_ENV === "production") {
  app.use(cors({
    origin: /https?:\/\/www.capellari.net/
  }));
} else {
  app.use(cors());
}

app.use(helmet());
app.use(morgan('dev'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
const api = Router();
setup_certificates(api);
setup_users(api);
setup_servers(api);

app.use("/api", api);

// Error handlers
app.use(errors());