import mongoose, { Document, Schema } from 'mongoose';

// Interface
export interface IUser extends Document {
  email: string,
  firstName: string,
  lastName: string
}

// Schema
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true }
});

export default mongoose.model<IUser>('User', UserSchema)