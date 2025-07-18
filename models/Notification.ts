import mongoose from 'mongoose';

export interface INotification extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: 'match_result' | 'referral_bonus' | 'wallet_update' | 'match_joined' | 'admin_action' | 'security_alert';
  title: string;
  message: string;
  data?: {
    matchId?: string;
    amount?: number;
    transactionId?: string;
    referralUserId?: string;
    actionType?: string;
    auditId?: string;
    riskScore?: number;
    reason?: string;
    alertType?: string;
    details?: string;
  };
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['match_result', 'referral_bonus', 'wallet_update', 'match_joined', 'admin_action', 'security_alert'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  data: {
    matchId: String,
    amount: Number,
    transactionId: String,
    referralUserId: String,
    actionType: String,
    auditId: String,
    riskScore: Number,
    reason: String,
    alertType: String,
    details: String,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for better query performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
