import mongoose from 'mongoose';

const BanActionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: ['ban', 'unban'],
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
BanActionSchema.index({ userId: 1 });
BanActionSchema.index({ adminId: 1 });
BanActionSchema.index({ createdAt: -1 });

export interface IBanAction extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  action: 'ban' | 'unban';
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.models.BanAction || mongoose.model<IBanAction>('BanAction', BanActionSchema);
