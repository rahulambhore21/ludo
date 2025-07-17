import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

interface CreateNotificationData {
  userId: string;
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
}

/**
 * Create a notification for a user
 */
export async function createNotification(notificationData: CreateNotificationData) {
  try {
    await dbConnect();
    
    const notification = new Notification({
      userId: new mongoose.Types.ObjectId(notificationData.userId),
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data,
      read: false,
      createdAt: new Date(),
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create match result notification
 */
export async function createMatchResultNotification(
  userId: string, 
  won: boolean, 
  amount: number, 
  matchId: string
) {
  const title = won ? '🎉 Match Won!' : '😔 Match Lost';
  const message = won 
    ? `You won ₹${amount} in your match!`
    : `Better luck next time! You lost ₹${amount}.`;

  return createNotification({
    userId,
    type: 'match_result',
    title,
    message,
    data: { matchId, amount }
  });
}

/**
 * Create referral bonus notification
 */
export async function createReferralBonusNotification(
  userId: string,
  amount: number,
  referralUserName: string
) {
  return createNotification({
    userId,
    type: 'referral_bonus',
    title: '🎁 Referral Bonus!',
    message: `You earned ₹${amount} from ${referralUserName}'s match win!`,
    data: { amount }
  });
}

/**
 * Create wallet update notification
 */
export async function createWalletUpdateNotification(
  userId: string,
  type: 'deposit_approved' | 'withdrawal_approved' | 'deposit_rejected' | 'withdrawal_rejected',
  amount: number,
  transactionId: string
) {
  let title = '';
  let message = '';

  switch (type) {
    case 'deposit_approved':
      title = '✅ Deposit Approved';
      message = `Your deposit of ₹${amount} has been approved!`;
      break;
    case 'withdrawal_approved':
      title = '💰 Withdrawal Approved';
      message = `Your withdrawal of ₹${amount} has been processed!`;
      break;
    case 'deposit_rejected':
      title = '❌ Deposit Rejected';
      message = `Your deposit of ₹${amount} was rejected. Contact support.`;
      break;
    case 'withdrawal_rejected':
      title = '❌ Withdrawal Rejected';
      message = `Your withdrawal of ₹${amount} was rejected. Amount refunded.`;
      break;
  }

  return createNotification({
    userId,
    type: 'wallet_update',
    title,
    message,
    data: { amount, transactionId }
  });
}

/**
 * Create match joined notification
 */
export async function createMatchJoinedNotification(
  userId: string,
  joinerName: string,
  matchId: string,
  entryFee: number
) {
  return createNotification({
    userId,
    type: 'match_joined',
    title: '🎮 Someone Joined Your Match!',
    message: `${joinerName} joined your ₹${entryFee} match. Game is starting!`,
    data: { matchId, amount: entryFee }
  });
}

/**
 * Create admin action notification
 */
export async function createAdminActionNotification(
  userId: string,
  actionType: 'refund_approved' | 'refund_rejected' | 'account_warned' | 'account_suspended',
  amount?: number,
  reason?: string
) {
  let title = '';
  let message = '';

  switch (actionType) {
    case 'refund_approved':
      title = '✅ Refund Approved';
      message = `Your refund of ₹${amount} has been approved by admin!`;
      break;
    case 'refund_rejected':
      title = '❌ Refund Rejected';
      message = `Your refund request was rejected. Reason: ${reason || 'Contact support for details'}`;
      break;
    case 'account_warned':
      title = '⚠️ Account Warning';
      message = `Your account has been warned. Reason: ${reason || 'Violation of terms'}`;
      break;
    case 'account_suspended':
      title = '🚫 Account Suspended';
      message = `Your account has been suspended. Reason: ${reason || 'Contact support'}`;
      break;
  }

  return createNotification({
    userId,
    type: 'admin_action',
    title,
    message,
    data: { actionType, amount, reason }
  });
}

/**
 * Create security alert notification
 */
export async function createSecurityAlertNotification(
  userId: string,
  alertType: 'suspicious_transaction' | 'multiple_disputes' | 'high_risk_behavior' | 'unusual_activity',
  details: string,
  riskScore?: number
) {
  let title = '';
  let message = '';

  switch (alertType) {
    case 'suspicious_transaction':
      title = '🔒 Security Alert - Transaction';
      message = `Suspicious transaction detected: ${details}`;
      break;
    case 'multiple_disputes':
      title = '⚠️ Security Alert - Disputes';
      message = `Multiple disputes detected on your account: ${details}`;
      break;
    case 'high_risk_behavior':
      title = '🚨 Security Alert - High Risk';
      message = `High risk behavior pattern detected: ${details}`;
      break;
    case 'unusual_activity':
      title = '👀 Security Alert - Activity';
      message = `Unusual activity detected: ${details}`;
      break;
  }

  return createNotification({
    userId,
    type: 'security_alert',
    title,
    message,
    data: { alertType, riskScore, details }
  });
}
