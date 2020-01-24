import { Request } from 'express';
import { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import _ from 'lodash';

import UserData from 'data/user';
import { generateToken } from 'data/token';
import Server from 'models/server';
import Token from 'schemas/token';

// Schema
const User = new Schema<UserData>({
  email: { type: String, required: true, unique: true, lowercase: true, validate: validator.isEmail },
  password: { type: String, required: true, minlength: 8 },
  admin: { type: Boolean, default: false },
  tokens: [Token]
});

// Events
User.pre<UserData>('save', async function(next) {
  // Hash the password before saving
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }

  next();
});

User.post<UserData>('remove', async function(user) {
  await Server.remove({ user: user.id });
});

// Methods
User.methods.generateAuthToken = async function(req: Request) {
  // Generate a new token
  const token = this.tokens.create({
    token: generateToken(this),
    from: req.ip
  });
  this.tokens.push(token);
  await this.save();

  return token;
};

User.methods.toJSON = function(options) {
  return _.omit(this.toObject(options), ['password', 'tokens']);
};

// Statics
User.statics.findByCredentials = async function(email: string, password: string): Promise<UserData | null> {
  // Search user by email and password
  const user = await this.findOne({ email });
  if (!user) return null;

  // Check password
  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;

  return user;
};

export default User;