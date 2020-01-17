import { Router } from 'express';

import { httpError } from '../errors';
import User from '../models/user';
import auth, { onlyAdmin } from '../middlewares/auth';
import required from '../middlewares/required';

// Setup routes
export default function(app: Router) {
  // Get all (admin only)
  app.get('/users', auth, onlyAdmin, async function(req, res) {
    // Gather all users data
    const users = await User.find({}, { _id: true, email: true });
    res.send(users);
  });

  // Add a user
  app.post('/users', required('email', 'password'), async function(req, res) {
    try {
      // Create new user
      const user = new User(req.body);
      await user.save();

      res.send(user);
    } catch (error) {
      return httpError(res).BadRequest(error);
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
      return httpError(res).NotFound(`No user found at ${id}`);
    }

    res.send(user);
  });

  // Modify myself
  app.put('/user/me', auth, async function(req, res) {
    // Cannot make myself an admin
    if (!req.user.admin && req.body.admin) {
      req.body.admin = false;
    }

    // Update user
    await req.user.updateOne(req.body);
    res.send(req.user);
  });

  // Modify user (admin only)
  app.put('/user/:id', auth, onlyAdmin, async function(req, res) {
    // Get user data
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return httpError(res).NotFound(`No user found at ${id}`);
    }

    // Update user
    await user.updateOne(req.body);
    res.send(user);
  });

  // Delete myself
  app.delete('/user/me', auth, async function(req, res) {
    // Delete user data
    const { id } = req.user.id;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return httpError(res).NotFound(`No user found at ${id}`);
    }

    res.send(user);
  });

  // Delete user (admin only)
  app.delete('/user/:id', auth, onlyAdmin, async function(req, res) {
    // Delete user data
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return httpError(res).NotFound(`No user found at ${id}`);
    }

    res.send(user);
  });

  // Login route
  app.post('/users/login', required('email', 'password'), async function(req, res) {
    // Get user
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);

    if (!user) {
      return httpError(res).Unauthorized('Login failed');
    }

    const token = await user.generateAuthToken();
    res.send(token);
  });

  // Logout
  app.post('/user/me/logout', auth, async function(req, res) {
    // Remove token
    await req.token.remove();
    await req.user.save();

    res.send({});
  });
}