import { Schema } from 'mongoose';
import validator from 'validator';

import ServerData from 'data/server';

// Schema
const Server = new Schema<ServerData>({
  ip: { type: String, required: true, validate: validator.isIP },
  port: { type: Number, default: 0 },
  country: { type: String, required: true, index: true },
  available: { type: Boolean, default: false },
  user: { type: Schema.Types.ObjectId, required: true }
});

export default Server;