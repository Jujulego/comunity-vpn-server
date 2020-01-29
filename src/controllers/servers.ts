import { Request } from 'express';
import IPData from 'ipdata';

import { env } from 'env';
import { HttpError } from 'middlewares/errors';

import ServerData from 'data/server';
import ServerModel from 'models/server';

// Type
export interface SimpleServer {
  _id: string,
  ip: string,
  port: number,
  country: string
}

export interface Country {
  _id: string,
  count: number
}

// Setup ipdata service
const ipdata = new IPData(env.IPDATA_KEY);

// Controller
class Servers {
  // Methods
  static transformServer(req: Request) {
    return (doc: ServerData, ret: any) => {
      if (req.user.admin) return ret;

      // Filter other user's data
      return {
        ...ret,
        users: ret.users && ret.users.filter((up: any) => up.user == req.user.id)
      }
    }
  }

  static async createServer(req: Request, ip: string): Promise<ServerData> {
    // Get ip's country
    const { country_name: country } = await ipdata.lookup(ip);

    // Create server
    const server = new ServerModel({ ip, country, users: [] });
    return await server.save();
  }

  static async getServer(req: Request, ip: string): Promise<ServerData> {
    // Get server
    const server = await ServerModel.findOne({ ip });
    if (!server) throw HttpError.NotFound(`Server ${ip} not found`);

    return server;
  }

  static async getOrCreateServer(req: Request, ip: string): Promise<ServerData> {
    // Get server
    let server = await ServerModel.findOne({ ip });
    if (!server) {
      server = await this.createServer(req, ip);
    }

    return server;
  }

  static async findSomeServers(req: Request, filters: Partial<ServerData>, sampleSize: number = 5): Promise<SimpleServer[]> {
    // Aggregate data
    return ServerModel.aggregate([
      { $match: filters },
      { $unwind: { path: '$users' } },
      { $sample: { size: sampleSize } },
      { $project: { _id: 1, ip: 1, port: '$users.port', country: 1 }},
    ]);
  }

  static async countries(req: Request): Promise<Country[]> {
    // Aggregate data
    return ServerModel.aggregate([
      { $group: {
        _id: '$country',
        count: { $sum: { $size: '$users' } }
      } },
      { $match: { count: { $gt: 0 } } },
      { $sort: { _id: 1 } }
    ]);
  }

  static async setServerAvailable(req: Request, ip: string, port: number): Promise<ServerData> {
    // Get or create server
    const server = await this.getOrCreateServer(req, ip);

    // Search for port
    let up = server.users.find(up => up.port === port);
    if (up && up.user !== req.user.id) throw HttpError.Forbidden(`Port ${ip}:${port} is already used`);

    // Add user
    if (!up) {
      up = server.users.create({ port, user: req.user });
      server.users.push(up);
    }

    return await server.save();
  }

  static async setServerUnavailable(req: Request, ip: string, port: number): Promise<ServerData> {
    // Get or create server
    const server = await this.getServer(req, ip);

    // Search for port
    let up = server.users.find(up => up.port === port);
    if (!up) throw HttpError.NotFound(`Port ${ip}:${port} not found`);
    if (up.user !== req.user.id) throw HttpError.Forbidden();

    // Delete port
    await up.remove();
    return await server.save();
  }
}

export default Servers;