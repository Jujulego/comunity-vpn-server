import { Router } from 'express';

import { httpError } from '../errors';
import ipdata from '../ipdata';
import auth from '../middlewares/auth';
import required from '../middlewares/required';
import Server from '../models/server';

// Setup routes
export default function(app: Router) {
  // Add server
  app.post('/server', auth, required('ip'), async function(req, res, next) {
    try {
      // Get ip's country
      const { ip } = req.body;
      const { country_name: country } = await ipdata.lookup(ip, 'country_name');

      // Create server
      const server = new Server({ ip, country, user: req.user });
      await server.save();

      res.send(server);
    } catch (error) {
      next(error);
    }
  });

  // Get server data
  app.get('/server/:id', auth, async function(req, res, next) {
    try {
      // Get server data
      const { id } = req.params;
      const server = await Server.findById(id);

      if (!server) {
        return httpError(res).NotFound(`No server found at ${id}`);
      }

      res.send(server);
    } catch (error) {
      next(error);
    }
  });

  // Set server available
  app.put('/server/:id/up', auth, required('port'), async function(req, res, next) {
    try {
      // Get server data
      const { id } = req.params;
      const { port } = req.body;
      const server = await Server.findByIdAndUpdate(id,
        { available: true, port },
        { new: true }
        );

      if (!server) {
        return httpError(res).NotFound(`No server found at ${id}`);
      }

      res.send(server);
    } catch (error) {
      next(error);
    }
  });

  // Set server unavailable
  app.put('/server/:id/down', auth, async function(req, res, next) {
    try {
      // Get server data
      const { id } = req.params;
      const server = await Server.findByIdAndUpdate(id,
        { available: false },
        { new: true }
      );

      if (!server) {
        return httpError(res).NotFound(`No server found at ${id}`);
      }

      res.send(server);
    } catch (error) {
      next(error);
    }
  });

  // Delete server
  app.delete('/server/:id', auth, async function(req, res, next) {
    try {
      // Get server data
      const { id } = req.params;
      const server = await Server.findByIdAndDelete(id);

      if (!server) {
        return httpError(res).NotFound(`No server found at ${id}`);
      }

      res.send(server);
    } catch (error) {
      next(error);
    }
  });
}