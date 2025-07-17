import mongoose from 'mongoose';

export interface IDisputeTracker extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: 'conflict' | 'cancel_request' | 'repeated_dispute' | 'suspicious_behavior' | 'fake_proof' | 'payment_dispute';
  matchId?: mongoose.Types.ObjectId;
  transactionId?: mongoose.Types.ObjectId;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  actionTaken?: 'warning' | 'temporary_ban' | 'permanent_ban' | 'account_restriction' | 'none';
  evidence?: {
    proofUrls?: string[];
    screenshots?: string[];
    metadata?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  frequency: {
    totalDisputes: number;
    disputesThisMonth: number;
    disputesThisWeek: number;
    lastDisputeDate: Date;
  };
  riskScore: number; // 0-100, higher is more risky
  autoFlagged: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

const DisputeTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['conflict', 'cancel_request', 'repeated_dispute', 'suspicious_behavior', 'fake_proof', 'payment_dispute'],
    required: true,
    index: true
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    default: null
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'dismissed'],
    default: 'open',
    index: true
  },
  adminNotes: {
    type: String,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  actionTaken: {
    type: String,
    enum: ['warning', 'temporary_ban', 'permanent_ban', 'account_restriction', 'none'],
    default: 'none'
  },
  evidence: {
    proofUrls: [String],
    screenshots: [String],
    metadata: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  frequency: {
    totalDisputes: {
      type: Number,
      default: 1
    },
    disputesThisMonth: {
      type: Number,
      default: 1
    },
    disputesThisWeek: {
      type: Number,
      default: 1
    },
    lastDisputeDate: {
      type: Date,
      default: Date.now
    }
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true
  },
  autoFlagged: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedAt: {
    type: Date,
    default: null
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
DisputeTrackerSchema.index({ userId: 1, createdAt: -1 });
DisputeTrackerSchema.index({ status: 1, severity: 1 });
DisputeTrackerSchema.index({ riskScore: -1, autoFlagged: 1 });
DisputeTrackerSchema.index({ type: 1, createdAt: -1 });

export default mongoose.models.DisputeTracker || mongoose.model<IDisputeTracker>('DisputeTracker', DisputeTrackerSchema);
