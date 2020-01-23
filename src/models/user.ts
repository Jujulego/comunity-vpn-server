import mongoose, { Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import _ from 'lodash';

import { User as UserData } from 'data/user';
import { generateToken } from 'data/token';

import Server from './server';

// Interface
interface UserModel extends Model<UserData> {
  // Methods
  findByCredentials(email: string, password: string): Promise<UserData | null>;
}

// Schema
const schema = new Schema<UserData>({
  email: { type: String, required: true, unique: true, lowercase: true, validate: validator.isEmail },
  password: { type: String, required: true, minlength: 8 },
  admin: { type: Boolean, default: false },
  tokens: [{
    token: { type: String, required: true }
  }]
});

// Events
schema.pre<UserData>('save', async function(next) {
  // Hash the password before saving
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }

  next();
});

schema.post<UserData>('remove', async function(user) {
  await Server.remove({ user: user.id });
});

// Methods
schema.methods.generateAuthToken = async function() {
  // Generate a new token
  const token = this.tokens.create({ token: generateToken(this) });
  this.tokens.push(token);
  await this.save();

  return token;
};

schema.methods.toJSON = function(options) {
  return _.omit(this.toObject(options), ['password', 'tokens']);
};

// Statics
schema.statics.findByCredentials = async function(email: string, password: string): Promise<UserData | null> {
  // Search user by email and password
  const user = await User.findOne({ email });
  if (!user) return null;

  // Check password
  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;

  return user;
};

// Create model
const User = mongoose.model<UserData, UserModel>('User', schema);

export default User;