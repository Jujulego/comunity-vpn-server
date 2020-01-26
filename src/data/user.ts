import { Request } from 'express';
import { Document, Types } from 'mongoose';

import Token from './token';

// Interface
interface User extends Document {
  // Attributes
  email: string
  password: string
  admin: boolean
  readonly tokens: Types.DocumentArray<Token>

  // Methods
  generateAuthToken(req: Request): Promise<Token>
}

export default User;