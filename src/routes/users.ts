import { Router } from 'express';
import validator from 'validator';

import { aroute } from 'utils';

import auth, { onlyAdmin } from 'middlewares/auth';
import required from 'middlewares/required';

import Users from 'controllers/users';
import User from 'models/user';
import Server from 'models/server';

// Utils
const isUserId = (str: string) => (str == 'me') || validator.isMongoId(str);

// Setup routes
export default (app: Router) => {
  // Get all (admin only)
  app.get('/users', auth, onlyAdmin,
    aroute(async (req, res) => {
      res.send(await User.find({}));
    })
  );

  // Add a user
  app.post('/users',
    required({ body: { email: validator.isEmail, password: true } }),
    aroute(async (req, res) => {
      res.send(await Users.createUser(req, req.body));
    })
  );

  // Get user
  app.get('/user/:id', auth,
    required({ params: { id: isUserId } }),
    aroute(async (req, res) => {
      res.send(await Users.getUser(req, req.params.id))
    })
  );

  // Get my servers
  app.get('/user/me/servers/', auth,
    aroute(async (req, res) => {
      res.send(await Server.find({ 'users.user': req.user }));
    })
  );

  // Get user's servers (admin only)
  app.get('/user/:id/servers/', auth,
    required({ params: { id: isUserId } }),
    aroute(async (req, res) => {
      // Get user
      const user = await Users.getUser(req, req.params.id);

      // Get servers
      res.send(await Server.find({ 'users.user': user }));
    })
  );

  // Modify user
  app.put('/user/:id', auth,
    required({ params: { id: isUserId } }),
    aroute(async (req, res) => {
      res.send(await Users.updateUser(req, req.params.id, req.body));
    })
  );

  // Delete a token
  app.delete('/user/:id/token/:tokenId', auth,
    required({ params: { id: isUserId, tokenId: validator.isMongoId } }),
    aroute(async (req, res) => {
      const { id, tokenId } = req.params;
      res.send(await Users.deleteUserToken(req, id, tokenId));
    })
  );

  // Delete user
  app.delete('/user/:id', auth,
    required({ params: { id: isUserId } }),
    aroute(async (req, res) => {
      res.send(await Users.deleteUser(req, req.params.id));
    })
  );

  // Login route
  app.post('/users/login',
    required({ body: { email: true, password: true } }),
    aroute(async (req, res) => {
      const { email, password } = req.body;
      res.send(await Users.login(req, email, password));
    })
  );

  // Logout
  app.post('/user/me/logout', auth,
    aroute(async (req, res) => {
      // Remove token
      await req.token.remove();
      await req.user.save();

      res.send({});
    })
  );
};