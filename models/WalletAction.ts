import mongoose from 'mongoose';

const WalletActionSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['manual_add', 'manual_deduct'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
WalletActionSchema.index({ userId: 1 });
WalletActionSchema.index({ adminId: 1 });
WalletActionSchema.index({ createdAt: -1 });

export interface IWalletAction extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  type: 'manual_add' | 'manual_deduct';
  amount: number;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.models.WalletAction || mongoose.model<IWalletAction>('WalletAction', WalletActionSchema);
