import { Request } from 'express';

import { HttpError } from 'middlewares/errors';

import UserData from 'data/user';
import { verifyToken } from 'data/token';

import UserModel from 'models/user';

// Controller
class Users {
  // Methods
  static async createUser(req: Request, data: UserData): Promise<UserData> {
    // Create user
    const user = new UserModel(data);
    return await user.save();
  }

  static async getUser(req: Request, id: string): Promise<UserData> {
    if (id == 'me' || id == req.user.id) return req.user;

    // Only admin can access to other user's data
    if (!req.user.admin) throw HttpError.Forbidden();

    // Find user
    const user = await UserModel.findById(id);
    if (!user) throw HttpError.NotFound(`No user found at ${id}`);

    return user;
  }

  static async findWithToken(id: string, token: string): Promise<UserData> {
    const user = await UserModel.findOne({ _id: id, 'tokens.token': token });
    if (!user) throw HttpError.Unauthorized();

    return user;
  }

  static async authenticate(token?: string): Promise<UserData> {
    // Decode token
    if (!token) throw HttpError.Unauthorized();
    const data = verifyToken(token);

    // Search for user
    return this.findWithToken(data._id, token);
  }

  static async findAllUsers(req: Request): Promise<UserData[]> {
    // Only admin can access to other user's data
    if (!req.user.admin) throw HttpError.Forbidden();

    return UserModel.find({});
  }

  static async login(req: Request, email: string, password: string): Promise<{ _id: string, token: string }> {
    // Search user by credentials
    const user = await UserModel.findByCredentials(email, password);
    if (!user) throw HttpError.Unauthorized("Login failed");

    // Generate token
    const token = await user.generateAuthToken(req);
    return { _id: token._id, token: token.token };
  }

  static async updateUser(req: Request, id: string, data: Partial<UserData>): Promise<UserData> {
    // Get user to modifiy
    const user = await this.getUser(req, id);

    // Cannot change admin state if not admin myself
    if (!req.user.admin && data.admin !== undefined) {
      delete data.admin;
    }

    // Update user
    const { email, password, admin } = data;
    if (email !== undefined)    user.email    = email;
    if (password !== undefined) user.password = password;
    if (admin !== undefined)    user.admin    = admin;

    return await user.save();
  }

  static async deleteUserToken(req: Request, id: string, tokenId: string): Promise<UserData> {
    // Get user to modifiy
    const user = await this.getUser(req, id);

    // Find token
    const token = user.tokens.id(tokenId);
    if (!token) throw HttpError.NotFound(`No token found at ${tokenId}`);

    // Delete token
    await token.remove();
    return await user.save();
  }

  static async deleteUser(req: Request, id: string): Promise<UserData> {
    // Get user to delete
    const user = await this.getUser(req, id);
    return await user.remove();
  }
}

export default Users;