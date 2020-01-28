import { Router } from 'express';

import { httpError } from 'errors';

import auth, { onlyAdmin } from 'middlewares/auth';
import required from 'middlewares/required';

import User from 'models/user';
import Server from 'models/server';
import validator from 'validator';

// Utils
const mongoId = (param: string) => required({ params: { [param]: validator.isMongoId } });

// Setup routes
export default function(app: Router) {
  // Get all (admin only)
  app.get('/users', auth, onlyAdmin, async function(req, res, next) {
    try {
      // Gather all users data
      const users = await User.find({});
      res.send(users);
    } catch (error) {
      next(error);
    }
  });

  // Add a user
  app.post('/users', required({ body: ['email'] }), async function(req, res, next) {
    try {
      // Create new user
      const user = new User(req.body);
      await user.save();

      res.send(user);
    } catch (error) {
      next(error);
    }
  });

  // Get me
  app.get('/user/me', auth, function(req, res) {
    res.send(req.user);
  });

  // Get my servers
  app.get('/user/me/servers/', auth, async function(req, res, next) {
    try {
      // get my servers
      const servers = await Server.find({ 'users.user': req.user });
      res.send(servers);
    } catch (error) {
      next(error);
    }
  });

  // Get user (admin only)
  app.get('/user/:id', auth, onlyAdmin, mongoId('id'), async function(req, res, next) {
    try {
      // Get user data
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return httpError(res).NotFound(`No user found at ${id}`);
      }

      res.send(user);
    } catch (error) {
      next(error);
    }
  });

  // Get user's servers (admin only)
  app.get('/user/:id/servers/', auth, onlyAdmin, mongoId('id'), async function(req, res, next) {
    try {
      // get some servers
      const { id } = req.params;
      const servers = await Server.find({ 'users.user': id });

      res.send(servers);
    } catch (error) {
      next(error);
    }
  });

  // Modify myself
  app.put('/user/me', auth, async function(req, res, next) {
    try {
      // Cannot make myself an admin
      if (!req.user.admin && req.body.admin) {
        req.body.admin = false;
      }

      // Update user
      const { email, password, admin } = req.body;
      if (email !== undefined)    req.user.email    = email;
      if (password !== undefined) req.user.password = password;
      if (admin !== undefined)    req.user.admin    = admin;
      await req.user.save();

      res.send(req.user);
    } catch (error) {
      next(error);
    }
  });

  // Modify user (admin only)
  app.put('/user/:id', auth, onlyAdmin, mongoId('id'), async function(req, res, next) {
    try {
      // Get user data
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return httpError(res).NotFound(`No user found at ${id}`);
      }

      // Update user
      const { email, password, admin } = req.body;
      if (email !== undefined)    user.email    = email;
      if (password !== undefined) user.password = password;
      if (admin !== undefined)    user.admin    = admin;
      await user.save();

      res.send(user);
    } catch (error) {
      next(error);
    }
  });

  // Delete myself
  app.delete('/user/me', auth, async function(req, res, next) {
    try {
      // Delete user data
      const { id } = req.user.id;
      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return httpError(res).NotFound(`No user found at ${id}`);
      }

      res.send(user);
    } catch (error) {
      next(error);
    }
  });

  // Delete a token
  app.delete('/user/me/token/:id', auth, mongoId('id'), async function(req, res, next) {
    try {
      // delete token
      const { id } = req.params;

      const token = req.user.tokens.id(id);
      if (!token) {
        return httpError(res).NotFound(`No token found at ${id}`);
      }

      await token.remove();
      await req.user.save();

      res.send(token);
    } catch (error) {
      next(error);
    }
  });

  // Delete user (admin only)
  app.delete('/user/:id', auth, onlyAdmin, mongoId('id'), async function(req, res, next) {
    try {
      // Delete user data
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return httpError(res).NotFound(`No user found at ${id}`);
      }

      await user.remove();
      res.send(user);
    } catch (error) {
      next(error);
    }
  });

  // Delete a token
  app.delete('/user/:id/token/:token', auth, mongoId('id'), mongoId('token'), async function(req, res, next) {
    try {
      // delete token
      const { id, token: tid } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return httpError(res).NotFound(`No user found at ${id}`);
      }

      const token = user.tokens.id(tid);

      if (!token) {
        return httpError(res).NotFound(`No token found at ${tid}`);
      }

      await token.remove();
      await user.save();

      res.send(token);
    } catch (error) {
      next(error);
    }
  });

  // Login route
  app.post('/users/login', required({ body: ['email'] }), async function(req, res, next) {
    try {
      // Get user
      const { email, password } = req.body;
      const user = await User.findByCredentials(email, password);

      if (!user) {
        return httpError(res).Unauthorized('Login failed');
      }

      const token = await user.generateAuthToken(req);
      res.send({ _id: token.id, token: token.token });
    } catch (error) {
      next(error);
    }
  });

  // Logout
  app.post('/user/me/logout', auth, async function(req, res, next) {
    try {
      // Remove token
      await req.token.remove();
      await req.user.save();

      res.send({});
    } catch (error) {
      next(error);
    }
  });
}