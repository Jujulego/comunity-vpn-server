import { Router } from 'express';

import User from '../models/user';
import auth, { onlyAdmin } from '../middlewares/auth';

// Setup routes
export default function(app: Router) {
  // Get all (admin only)
  app.get('/users', auth, onlyAdmin, async function(req, res) {
    // Gather all users data
    const users = await User.find({}, { _id: true, email: true });
    res.send(users);
  });

  // Add a user
  app.post('/users', async function(req, res) {
    try {
      // Create new user
      const user = new User(req.body);
      await user.save();

      res.send(user);
    } catch (error) {
      return res.status(400).send({ error });
    }
  });

  // Get me
  app.get('/user/me', auth, function(req, res) {
    res.send(req.user);
  });

  // Get user (admin only)
  app.get('/user/:id', auth, onlyAdmin, async function(req, res) {
    // Get user data
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).send({ error:`No user found at ${id}` });
    }

    res.send(user);
  });

  // Modify user (admin only)
  app.put('/user/:id', auth, onlyAdmin, async function(req, res) {
    // Get user data
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).send({ error:`No user found at ${id}` });
    }

    // update object
    await user.updateOne(req.body);
    res.send(user);
  });

  // Delete user (admin only)
  app.delete('/user/:id', auth, onlyAdmin, async function(req, res) {
    // Delete user data
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).send({ error:`No user found at ${id}` });
    }

    res.send(user);
  });

  // Login route
  app.post('/users/login', async function(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findByCredentials(email, password);

      if (!user) {
        return res.status(401).send({ error: 'Login failed' });
      }

      const token = await user.generateAuthToken();
      res.send({ user, token: token.token });
    } catch (error) {
      return res.status(400).send({ error });
    }
  });

  // Logout
  app.post('/user/me/logout', auth, async function(req, res) {
    // Remove token
    const index = req.user.tokens.findIndex(
      token => token.token === req.token.token
    );

    if (index != -1) {
      req.user.tokens.splice(index);
      await req.user.save();
    }

    res.send({});
  });
}