import express, { Request, Response, Router } from 'express';
import setup_users from './routes/users';

// Prepare express app
export const app = express();

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "hello world !" });
});

const api = Router();
setup_users(api);

app.use("/api", api);