import { Router } from 'express';
import validator from 'validator';

import { aroute } from 'utils';

import auth, { onlyAdmin } from 'middlewares/auth';
import required from 'middlewares/required';

import Servers from 'controllers/servers';
import ServerData from 'data/server';
import Server from 'models/server';

// Setup routes
export default (app: Router) => {
  // Get server data
  app.get('/server/:ip', auth,
    required({ params: { ip: validator.isIP } }),
    aroute(async (req, res) => {
      // Get server data
      const server = await Servers.getServer(req, req.params.ip);
      res.send(server.toJSON({ transform: Servers.transformServer(req) }));
    })
  );

  // Set server available
  app.put('/server/:ip/up', auth,
    required({ params: { ip: validator.isIP }, body: { port: true } }),
    aroute(async (req, res) => {
      const server = await Servers.setServerAvailable(req, req.params.ip, req.body.port);
      res.send(server.toJSON({ transform: Servers.transformServer(req) }));
    })
  );

  // Set server unavailable
  app.put('/server/:ip/down', auth,
    required({ params: { ip: validator.isIP }, body: { port: true } }),
    aroute(async (req, res) => {
      const server = await Servers.setServerUnavailable(req, req.params.ip, req.body.port);
      res.send(server.toJSON({ transform: Servers.transformServer(req) }));
    })
  );

  // Get some servers
  app.get('/servers', auth,
    required({ query: { size: { required: false, validator: validator.isNumeric } } }),
    aroute(async (req, res) => {
      // get filters
      const filters: Partial<ServerData> = {};
      if (req.query.country) filters.country = req.query.country;

      // get some servers
      const size = req.query.size && parseInt(req.query.size);
      res.send(await Servers.findSomeServers(req, filters, size));
    })
  );

  // Get all servers (admin only)
  app.get('/servers/all', auth, onlyAdmin,
    aroute(async (req, res) => {
      // get all servers
      const servers = await Server.find({});
      res.send(servers);
    })
  );

  // Get countries
  app.get('/servers/countries', auth,
    aroute(async (req, res) => {
      res.send(await Servers.countries(req));
    })
  );
}