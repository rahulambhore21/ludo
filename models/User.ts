import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  name: string;
  phone: string;
  isAdmin: boolean;
  balance: number;
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  isBanned: boolean;
  banReason?: string;
  bannedBy?: mongoose.Types.ObjectId;
  bannedAt?: Date;
  createdAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  balance: {
    type: Number,
    default: 0,
  },
  referralCode: {
    type: String,
    unique: true,
    required: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  banReason: {
    type: String,
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  bannedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent model re-compilation during development
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
