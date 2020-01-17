import mongoose, { Schema } from 'mongoose';
import validator from 'validator';

import { Server as ServerData } from '../data/server';

// Schema
const schema = new Schema<ServerData>({
  ip: { type: String, required: true, validate: validator.isIP },
  port: { type: Number, default: 0 },
  country: { type: String, required: true, index: true },
  available: { type: Boolean, default: false },
  user: { type: Schema.Types.ObjectId, required: true }
});

// Create model
const Server = mongoose.model<ServerData>('Server', schema);

export default Server;