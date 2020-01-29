import { Request } from 'express';
import IPData from 'ipdata';

import { env } from 'env';
import { HttpError } from 'middlewares/errors';

import ServerData from 'data/server';
import UserData from 'data/user';

import ServerModel from 'models/server';

// Type
export interface ServerProposal {
  _id: string,
  ip: string,
  port: number,
  country: string
}

export interface UserServer {
  _id: string,
  ip: string,
  port: number,
  country: string,
  user: string
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

  static async findSomeServers(req: Request, filters: Partial<ServerData>, sampleSize: number = 5): Promise<ServerProposal[]> {
    // Aggregate data
    return ServerModel.aggregate([
      { $match: filters },
      { $unwind: { path: '$users' } },
      { $sample: { size: sampleSize } },
      { $project: { _id: 1, ip: 1, port: '$users.port', country: 1 }},
    ]);
  }

  static async findUserServers(req: Request, user: UserData): Promise<UserServer[]> {
    // Aggregate data
    return ServerModel.aggregate([
      { $match: { 'users.user': user._id } },
      { $unwind: { path: '$users' } },
      { $project: { _id: '$users._id', ip: 1, port: '$users.port', country: 1, user: '$users.user' }},
      { $match: { user: user._id } }
    ]);
  }

  static async findAllServers(req: Request): Promise<UserServer[]> {
    // Available only for admin's
    if (!req.user.admin) throw HttpError.Forbidden();

    // Aggregate data
    return ServerModel.aggregate([
      { $unwind: { path: '$users' } },
      { $project: { _id: '$users._id', ip: 1, port: '$users.port', country: 1, user: '$users.user' }}
    ]);
  }

  static async countries(_: Request): Promise<Country[]> {
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

  static async setServerAvailable(req: Request, ip: string, port: number, user: UserData): Promise<UserServer> {
    // Get or create server
    const server = await this.getOrCreateServer(req, ip);

    // Search for port
    let up = server.users.find(up => up.port === port);
    if (up && up.user !== user.id) throw HttpError.Forbidden(`Port ${ip}:${port} is already used`);

    // Add user
    if (!up) {
      up = server.users.create({ port, user });
      server.users.push(up);
    }

    await server.save();
    return {
      _id: up._id,
      ip: server.ip,
      port: up.port,
      country: server.country,
      user: up.user
    }
  }

  static async setServerUnavailable(req: Request, ip: string, port: number): Promise<UserServer> {
    // Get or create server
    const server = await this.getServer(req, ip);

    // Search for port
    let up = server.users.find(up => up.port === port);
    if (!up) throw HttpError.NotFound(`Port ${ip}:${port} not found`);
    if (!req.user.admin && up.user !== req.user.id) throw HttpError.Forbidden();

    // Delete port
    await up.remove();
    await server.save();

    return {
      _id: up._id,
      ip: server.ip,
      port: up.port,
      country: server.country,
      user: up.user
    }
  }
}

export default Servers;