import mongoose from 'mongoose';

export interface ICancelRequest extends mongoose.Document {
  matchId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  reason: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CancelRequestSchema = new mongoose.Schema<ICancelRequest>({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'opponent_not_responding',
      'technical_issues',
      'game_crashed',
      'unfair_play',
      'personal_emergency',
      'other'
    ],
  },
  screenshotUrl: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  reviewNote: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
CancelRequestSchema.index({ matchId: 1 });
CancelRequestSchema.index({ requestedBy: 1 });
CancelRequestSchema.index({ status: 1 });

export default mongoose.models.CancelRequest || mongoose.model<ICancelRequest>('CancelRequest', CancelRequestSchema);
