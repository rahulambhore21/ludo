import mongoose from 'mongoose';

export interface IWalletAudit extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  transactionId?: mongoose.Types.ObjectId;
  type: 'balance_change' | 'suspicious_activity' | 'manual_adjustment' | 'refund' | 'winnings' | 'entry_fee';
  action: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: {
    matchId?: string;
    transactionType?: string;
    proofUrl?: string;
    [key: string]: any;
  };
  flagged: boolean;
  flagReason?: string;
  verificationStatus: 'pending' | 'verified' | 'suspicious' | 'blocked';
  createdAt: Date;
}

const WalletAuditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  type: {
    type: String,
    enum: ['balance_change', 'suspicious_activity', 'manual_adjustment', 'refund', 'winnings', 'entry_fee'],
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  flagged: {
    type: Boolean,
    default: false,
    index: true
  },
  flagReason: {
    type: String,
    default: null
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'suspicious', 'blocked'],
    default: 'pending',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
WalletAuditSchema.index({ userId: 1, createdAt: -1 });
WalletAuditSchema.index({ flagged: 1, verificationStatus: 1 });
WalletAuditSchema.index({ type: 1, createdAt: -1 });

export default mongoose.models.WalletAudit || mongoose.model<IWalletAudit>('WalletAudit', WalletAuditSchema);
