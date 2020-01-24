import { Schema } from 'mongoose';
import validator from 'validator';
import _ from 'lodash';

import TokenData from 'data/token';

// Schema
const Token = new Schema<TokenData>({
  from: { type: String, default: '0.0.0.0', validate: validator.isIP },
  token: { type: String, required: true, unique: true }
}, { timestamps: true });

// Methods
Token.methods.toJSON = function(options) {
  return _.omit(this.toObject(options), ['token']);
};

export default Token;