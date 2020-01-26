import mongoose, { Model } from 'mongoose';

import UserData from 'data/user';
import UserSchema from 'schemas/user';

// Interface
interface UserModel extends Model<UserData> {
  // Methods
  findByCredentials(email: string, password: string): Promise<UserData | null>;
}

// Create model
const User = mongoose.model<UserData, UserModel>('User', UserSchema);

export default User;