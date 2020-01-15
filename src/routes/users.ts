import { Router } from 'express';

import User from '../models/user';
import auth from '../middlewares/auth';

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
        res.send({ user, token: token.token });
      } else {
        res.status(401).send({ error: 'Login failed' });
      }

    } catch (error) {
      res.status(400).send({ error });
    }
  });

  app.get('/user/me', auth, function(req, res) {
    res.send(req.user);
  });

  app.post('/user/me/logout', auth, async function(req, res) {
    try {
      // Remove token
      const index = req.user.tokens.findIndex(
        token => token.token === req.token.token
      );

      if (index != -1) {
        req.user.tokens.splice(index);
        await req.user.save();
      }

      res.send({});
    } catch (error) {
      res.status(500).send({ error })
    }
  });
}