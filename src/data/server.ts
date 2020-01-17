import { Document } from 'mongoose';

import { User } from './user';

// Interface
export interface Server extends Document {
  ip: string,
  port: number,
  country: string,
  available: boolean,
  user: User['_id']
}