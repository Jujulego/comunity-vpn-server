import { Document, Types } from 'mongoose';

import User from './user';

// Interfaces
export interface UserPort extends Document {
  // Attributes
  user: User['id'],
  port: number
}

interface Server extends Document {
  // Attributes
  ip: string;
  country: string;
  readonly users: Types.DocumentArray<UserPort>;
}

export default Server;