import mongoose from 'mongoose';

export interface IOTP extends mongoose.Document {
  phone: string;
  otp: string;
  name: string;
  referredBy?: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema = new mongoose.Schema<IOTP>({
  phone: {
    type: String,
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // MongoDB TTL index
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for efficient queries
OTPSchema.index({ phone: 1, expiresAt: 1 });

export default mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);
