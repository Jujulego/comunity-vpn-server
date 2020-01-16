import { Router } from 'express';

import User from '../models/user';
import auth from '../middlewares/auth';

// Setup routes
export default function(app: Router) {
  // Get all (admin only)
  app.get('/users', auth, async function(req, res) {
    if (!req.user.admin) return res.status(403).send({ error: 'Forbidden' });

    try {
      // Gather all users data
      const users = await User.find({}, { _id: true, email: true });
      res.send(users);
    } catch (error) {
      res.status(500).send({ error })
    }
  });

  // Add a user
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

  // Get me
  app.get('/user/me', auth, function(req, res) {
    res.send(req.user);
  });

  // Get user (admin only)
  app.get('/user/:id', auth, async function(req, res) {
    // Check rights
    if (!req.user.admin) {
      return res.status(403).send({ error: 'Forbidden' });
    }

    try {
      // Get user data
      const user = await User.findById(req.params.id);

      if (!user) {
        res.status(404).send({ error: 'Not Found' });
      } else {
        res.send(user);
      }
    } catch (error) {
      res.status(500).send({ error })
    }
  });

  // Modify user (admin only)
  app.put('/user/:id', auth, async function(req, res) {
    // Check rights
    if (!req.user.admin) {
      return res.status(403).send({ error: 'Forbidden' });
    }

    try {
      // Get user data
      const user = await User.findById(req.params.id);

      if (!user) {
        res.status(404).send({ error: 'Not Found' });
      } else {
        const data = req.body;
        if (data.email) user.email = data.email;
        if (data.password) user.password = data.password;
        await user.save();

        res.send(user);
      }
    } catch (error) {
      res.status(500).send({ error })
    }
  });

  // Delete user (admin only)
  app.delete('/user/:id', auth, async function(req, res) {
    if (!req.user.admin) {
      return res.status(403).send({ error: 'Forbidden' });
    }

    try {
      // Delete user data
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        res.status(404).send({ error: 'Not Found' });
      } else {
        res.send(user);
      }
    } catch (error) {
      res.status(500).send({ error })
    }
  });

  // Login route
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
      console.log(error);
      res.status(400).send({ error });
    }
  });

  // Logout
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