import { Router } from 'express';
import validator from 'validator';

import { httpError } from 'errors';

import auth, { onlyAdmin } from 'middlewares/auth';
import required from 'middlewares/required';
import { route, aroute } from 'utils';

import User from 'models/user';
import Server from 'models/server';

// Utils
const isUserId = (str: string) => (str == 'me') || validator.isMongoId(str);
const userId = (param: string) => required({ params: { [param]: validator.isMongoId } });

// Setup routes
export default function(app: Router) {
  // Get all (admin only)
  app.get('/users', auth, onlyAdmin,
    aroute(async (req, res) => {
      res.send(await User.find({}));
    })
  );

  // Add a user
  app.post('/users',
    required({ body: { email: validator.isEmail } }),
    aroute(async (req, res) => {
      const user = new User(req.body);
      await user.save();

      res.send(user);
    })
  );

  // Get me
  app.get('/user/me', auth,
    route((req, res) => res.send(req.user))
  );

  // Get my servers
  app.get('/user/me/servers/', auth,
    aroute(async (req, res) => {
      res.send(await Server.find({ 'users.user': req.user }));
    })
  );

  // Get user (admin only)
  app.get('/user/:id', auth, onlyAdmin, userId('id'),
    aroute(async (req, res) => {
      // Get user data
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return httpError(res).NotFound(`No user found at ${id}`);
      }

      res.send(user);
    })
  );

  // Get user's servers (admin only)
  app.get('/user/:id/servers/', auth, onlyAdmin, userId('id'),
    aroute(async (req, res, next) => {
      // get some servers
      const { id } = req.params;
      const servers = await Server.find({ 'users.user': id });

      res.send(servers);
    })
  );

  // Modify myself
  app.put('/user/me', auth,
    aroute(async (req, res, next) => {
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
    })
  );

  // Modify user (admin only)
  app.put('/user/:id', auth, onlyAdmin, userId('id'),
    aroute(async (req, res, next) => {
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
    })
  );

  // Delete myself
  app.delete('/user/me', auth,
    aroute(async (req, res, next) => {
      // Delete user data
      const { id } = req.user.id;
      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return httpError(res).NotFound(`No user found at ${id}`);
      }

      res.send(user);
    })
  );

  // Delete a token
  app.delete('/user/me/token/:id', auth, userId('id'),
    aroute(async (req, res, next) => {
      // delete token
      const { id } = req.params;

      const token = req.user.tokens.id(id);
      if (!token) {
        return httpError(res).NotFound(`No token found at ${id}`);
      }

      await token.remove();
      await req.user.save();

      res.send(token);
    })
  );

  // Delete user (admin only)
  app.delete('/user/:id', auth, onlyAdmin, userId('id'),
    aroute(async (req, res, next) => {
      // Delete user data
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return httpError(res).NotFound(`No user found at ${id}`);
      }

      await user.remove();
      res.send(user);
    })
  );

  // Delete a token
  app.delete('/user/:id/token/:token', auth, userId('id'), userId('token'),
    aroute(async (req, res, next) => {
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
    })
  );

  // Login route
  app.post('/users/login', required({ body: ['email'] }),
    aroute(async (req, res, next) => {
      // Get user
      const { email, password } = req.body;
      const user = await User.findByCredentials(email, password);

      if (!user) {
        return httpError(res).Unauthorized('Login failed');
      }

      const token = await user.generateAuthToken(req);
      res.send({ _id: token.id, token: token.token });
    })
  );

  // Logout
  app.post('/user/me/logout', auth,
    aroute(async (req, res, next) => {
      // Remove token
      await req.token.remove();
      await req.user.save();

      res.send({});
    })
  );
}