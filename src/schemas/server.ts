import { Schema } from 'mongoose';
import validator from 'validator';

import ServerData from 'data/server';

// Schemas
const Server = new Schema<ServerData>({
  ip: { type: String, required: true, unique: true, validate: validator.isIP },
  country: { type: String, required: true, index: true },
  users: [{
    port: { type: Number, required: true },
    user: { type: Schema.Types.ObjectId, required: true }
  }]
});

export default Server;