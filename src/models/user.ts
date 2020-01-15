import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';

import { env } from '../env';

// Interface
export interface Token {
  readonly token: string
}

export interface IUser extends Document {
  // Attributes
  email: string
  password: string
  readonly tokens: Token[]

  // Methods
  generateAuthToken(): Promise<string>
}

interface MUser extends Model<IUser> {
  findByCredentials(email: string, password: string): Promise<IUser>;
}

// Schema
const schema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, validate: validator.isEmail },
  password: { type: String, required: true, minlength: 8 },
  tokens: [{
    token: { type: String, required: true }
  }]
});

// Events
schema.pre<IUser>('save', async function(next) {
  // Hash the password before saving
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }

  next();
});

// Methods
schema.methods.generateAuthToken = async function() {
  // Generate a new token
  const token = jwt.sign({ _id: this._id }, env.JWT_KEY);
  this.tokens.push({ token });
  await this.save();

  return token;
};

// Statics
schema.statics.findByCredentials = async function(email: string, password: string): Promise<IUser | null> {
  // Search user by email and password
  const user = await User.findOne({ email });
  if (!user) return null;

  // Check password
  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;

  return user;
};

// Create model
const User = mongoose.model<IUser, MUser>('User', schema);

export default User;