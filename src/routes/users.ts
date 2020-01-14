import { Router, Request, Response } from 'express';
import User, { IUser } from '../schema/user';

// Setup routes
export default function setup(app: Router) {
  // Routes
  app.get('/users', (req: Request, res: Response) => {
    User.find({}, (err: Error, users: IUser[]) => {
      if (err) {
        res.send(err)
      }

      res.json(users)
    })
  });
}