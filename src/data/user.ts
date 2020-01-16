import { Document, Types } from 'mongoose';

import { Token } from './token';

// Interface
export interface User extends Document {
  // Attributes
  email: string
  password: string
  admin: boolean
  readonly tokens: Types.DocumentArray<Token>

  // Methods
  generateAuthToken(): Promise<Token>
}