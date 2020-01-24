import { Router } from 'express';
import IPData from 'ipdata';

import { env } from 'env';
import { httpError } from 'errors';

import auth, { onlyAdmin } from 'middlewares/auth';
import required from 'middlewares/required';

import ServerData from 'data/server';
import Server from 'models/server';

// Setup ipdata service
const ipdata = new IPData(env.IPDATA_KEY);

// Setup routes
export default function(app: Router) {
  // Add server
  app.post('/server', auth, required('ip'), async function(req, res, next) {
    try {
      // Get ip's country
      const { ip } = req.body;
      const { country_name: country } = await ipdata.lookup(ip);

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
      const server = await Server.findById(id);

      // Errors
      if (!server) {
        return httpError(res).NotFound(`No server found at ${id}`);
      }

      if (!req.user.admin && server.user != req.user.id) {
        return httpError(res).Forbidden();
      }

      // Update server
      server.available = true;
      server.port = port;
      await server.save();

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
      const server = await Server.findById(id);

      // Errors
      if (!server) {
        return httpError(res).NotFound(`No server found at ${id}`);
      }

      if (!req.user.admin && server.user != req.user.id) {
        return httpError(res).Forbidden();
      }

      // Update server
      server.available = false;
      await server.save();

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
      const server = await Server.findById(id);

      // Errors
      if (!server) {
        return httpError(res).NotFound(`No server found at ${id}`);
      }

      if (!req.user.admin && server.user != req.user.id) {
        return httpError(res).Forbidden();
      }

      // Delete server
      await server.remove();

      res.send(server);
    } catch (error) {
      next(error);
    }
  });

  // Get some servers
  app.get('/servers', auth, async function(req, res, next) {
    try {
      // get filters
      const filters: Partial<ServerData> = {
        available: true
      };

      if (req.query.country) filters.country = req.query.country;

      // get some servers
      const servers = await Server.aggregate([
        { $match: filters },
        { $sample: { size: parseInt(req.query.size) || 5 } },
        { $project: { _id: 1, country: 1, ip: 1, port: 1 }},
      ]);

      res.send(servers);
    } catch (error) {
      next(error);
    }
  });

  // Get all servers (admin only)
  app.get('/servers/all', auth, onlyAdmin, async function(req, res, next) {
    try {
      // get all servers
      const servers = await Server.find();
      res.send(servers);
    } catch (error) {
      next(error);
    }
  });

  // Get countries
  app.get('/servers/countries', auth, async function(req, res, next) {
    try {
      // get available countries
      const countries = await Server.aggregate([
        {
          $group: {
            _id: '$country',
            available: { $sum: '$available' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.send(countries);
    } catch (error) {
      next(error);
    }
  });
}