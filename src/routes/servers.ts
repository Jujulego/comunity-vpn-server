import { Request, Router } from 'express';
import IPData from 'ipdata';
import validator from 'validator';

import { env } from 'env';
import { aroute } from 'utils';

import auth, { onlyAdmin } from 'middlewares/auth';
import { HttpError } from 'middlewares/errors';
import required from 'middlewares/required';

import ServerData from 'data/server';
import Server from 'models/server';

// Setup ipdata service
const ipdata = new IPData(env.IPDATA_KEY);

// Utils
const transformServer = (req: Request) => (doc: ServerData, ret: any) => {
  if (req.user.admin) return ret;
  return { ...ret, users: ret.users && ret.users.filter((up: any) => up.user == req.user.id) }
};

// Setup routes
export default function(app: Router) {
  // Get server data
  app.get('/server/:ip', auth,
    required({ params: { ip: validator.isIP } }),
    aroute(async (req, res) => {
      // Get server data
      const { ip } = req.params;
      const server = await Server.findOne({ ip });
      if (!server) throw HttpError.NotFound(`Server ${ip} not found`);

      res.send(server.toJSON({ transform: transformServer(req) }));
    })
  );

  // Set server available
  app.put('/server/:ip/up', auth,
    required({ params: { ip: validator.isIP }, body: { port: true } }),
    aroute(async (req, res) => {
      // Get server data
      const { ip } = req.params;
      const { port } = req.body;
      let server = await Server.findOne({ ip });

      // If server don't exists create it
      if (!server) {
        const { country_name: country } = await ipdata.lookup(ip);
        server = new Server({ ip, country, users: [] });
      }

      // Add user on port
      const up = server.users.find(up => up.port == port);

      if (up) {
        if (up.user != req.user.id) throw HttpError.Forbidden();
      } else {
        server.users.push(
          server.users.create({ port, user: req.user })
        );
      }

      // Save and respond
      await server.save();
      res.send(server.toJSON({ transform: transformServer(req) }));
    })
  );

  // Set server unavailable
  app.put('/server/:ip/down', auth,
    required({ params: { ip: validator.isIP }, body: { port: true } }),
    aroute(async (req, res) => {
      // Get server data
      const { ip } = req.params;
      const { port } = req.body;
      const server = await Server.findOne({ ip });

      // Error no server
      if (!server) throw HttpError.NotFound(`Server ${ip} not found`);

      // Find and delete port
      const up = server.users.find(up => up.port == port);
      if (up) await up.remove();
      await server.save();

      res.send(server.toJSON({ transform: transformServer(req) }));
    })
  );

  // Get some servers
  app.get('/servers', auth,
    aroute(async (req, res, next) => {
      // get filters
      const filters: Partial<ServerData> = {};
      if (req.query.country) filters.country = req.query.country;

      // get some servers
      const servers = await Server.aggregate([
        { $match: filters },
        { $unwind: { path: '$users' } },
        { $sample: { size: parseInt(req.query.size) || 5 } },
        { $project: { _id: 1, ip: 1, port: '$users.port', country: 1 }},
      ]);

      res.send(servers);
    })
  );

  // Get all servers (admin only)
  app.get('/servers/all', auth, onlyAdmin,
    aroute(async (req, res, next) => {
      // get all servers
      const servers = await Server.find();
      res.send(servers);
    })
  );

  // Get countries
  app.get('/servers/countries', auth,
    aroute(async (req, res, next) => {
      // get available countries
      const countries = await Server.aggregate([
        {
          $group: {
            _id: '$country',
            count: { $sum: { $size: '$users' } }
          }
        },
        { $match: { count: { $gt: 0 } } },
        { $sort: { _id: 1 } }
      ]);

      res.send(countries);
    })
  );
}