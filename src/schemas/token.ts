import { Schema } from 'mongoose';
import validator from 'validator';

import TokenData from 'data/token';

// Schema
const Token = new Schema<TokenData>({
  from: { type: String, default: '0.0.0.0', validate: validator.isIP },
  token: { type: String, required: true, unique: true }
}, { timestamps: true });

export default Token;