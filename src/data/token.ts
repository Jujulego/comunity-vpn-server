import jwt from 'jsonwebtoken';

import { env } from '../env';
import { User } from './user';

// Interfaces
export interface TokenContent {
  readonly _id: string
}

// Class
export class Token {
  // Attributes
  readonly token: string;

  // Constructor
  constructor(token: string) {
    this.token = token;
  }

  // Statics
  public static generate(user: User): Token {
    const token = jwt.sign({ _id: user._id }, env.JWT_KEY);
    return new Token(token);
  }

  public static verify(token: string | Token): TokenContent {
    if (typeof token !== 'string') {
      token = token.token;
    }

    // Verify
    return jwt.verify(token, env.JWT_KEY) as TokenContent;
  }

  // Methods
  public verify() {
    return Token.verify(this);
  }
}