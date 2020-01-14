import express, { NextFunction, Request, Response } from 'express';

// Prepare express app
export const app = express();

// Routes
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "hello world !" });
});