import { Router } from 'express';
import User from '../models/user';

// Setup routes
export default function(app: Router) {
  // Routes
  app.post('/users', async function(req, res) {
    try {
      // Create new user
      const user = new User(req.body);
      await user.save();

      res.send(user);
    } catch (error) {
      res.status(400).send({ error })
    }
  });

  app.post('/users/login', async function(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findByCredentials(email, password);

      if (user) {
        const token = await user.generateAuthToken();
        res.send({ user, token });
      } else {
        res.status(401).send({ error: 'Login failed' });
      }

    } catch (error) {
      res.status(400).send({ error });
    }
  });
}