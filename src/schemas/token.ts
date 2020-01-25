import { Schema } from 'mongoose';
import validator from 'validator';
import _ from 'lodash';

import TokenData from 'data/token';

// Schema
const Token = new Schema<TokenData>({
  from: { type: String, default: '0.0.0.0', validate: validator.isIP },
  token: { type: String, required: true, unique: true, sparse: true }
});

// Options
Token.set('timestamps', {
  createdAt: true,
  updatedAt: false
});

Token.set('toJSON', {
  transform: (doc, ret) => _.omit(ret, ['token'])
});

export default Token;