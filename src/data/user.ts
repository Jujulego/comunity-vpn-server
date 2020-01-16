import { Document } from 'mongoose';

import { Token } from './token';

// Interface
export interface User extends Document {
  // Attributes
  email: string
  password: string
  admin: boolean
  readonly tokens: Token[]

  // Methods
  generateAuthToken(): Promise<Token>
}