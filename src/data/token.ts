import jwt from 'jsonwebtoken';
import { Document } from 'mongoose';

import { env } from 'env';

// Interfaces
export interface TokenContent {
  readonly _id: any
}

interface Token extends Document {
  // Attributes
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly from: string;
  readonly token: string;
}

// Utils
export function generateToken(data: TokenContent): string {
  return jwt.sign({ _id: data._id }, env.JWT_KEY);
}

export function verifyToken(token: string | Token): TokenContent {
  if (typeof token !== 'string') {
    token = token.token;
  }

  // Verify
  return jwt.verify(token, env.JWT_KEY) as TokenContent;
}

export default Token;