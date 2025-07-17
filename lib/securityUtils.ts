import { NextRequest } from 'next/server';
import dbConnect from './mongodb';
import WalletAudit from '../models/WalletAudit';
import DisputeTracker from '../models/DisputeTracker';
import User from '../models/User';
import mongoose from 'mongoose';

/**
 * Creates a wallet audit entry for security tracking
 */
export async function createWalletAudit({
  userId,
  adminId = null,
  transactionId = null,
  type,
  action,
  amount,
  balanceBefore,
  balanceAfter,
  reason,
  request = null,
  metadata = {},
  autoFlag = false
}: {
  userId: string;
  adminId?: string | null;
  transactionId?: string | null;
  type: 'balance_change' | 'suspicious_activity' | 'manual_adjustment' | 'refund' | 'winnings' | 'entry_fee';
  action: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  request?: NextRequest | null;
  metadata?: any;
  autoFlag?: boolean;
}) {
  try {
    await dbConnect();

    // Extract IP and User Agent from request if available
    const ipAddress = request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown';
    const userAgent = request?.headers.get('user-agent') || null;

    // Auto-flag suspicious activities
    let flagged = autoFlag;
    let flagReason = null;
    let verificationStatus: 'pending' | 'verified' | 'suspicious' | 'blocked' = 'pending';

    // Security checks for suspicious patterns
    if (type === 'suspicious_activity') {
      flagged = true;
      flagReason = 'Automatically flagged as suspicious activity';
      verificationStatus = 'suspicious';
    }

    // Check for rapid balance changes
    if (Math.abs(amount) > 1000) {
      flagged = true;
      flagReason = flagReason || 'Large amount transaction';
      verificationStatus = 'suspicious';
    }

    // Check for unusual balance patterns
    const recentAudits = await WalletAudit.find({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    }).sort({ createdAt: -1 });

    if (recentAudits.length > 10) {
      flagged = true;
      flagReason = flagReason || 'Too many rapid transactions';
      verificationStatus = 'suspicious';
    }

    const audit = new WalletAudit({
      userId: new mongoose.Types.ObjectId(userId),
      adminId: adminId ? new mongoose.Types.ObjectId(adminId) : null,
      transactionId: transactionId ? new mongoose.Types.ObjectId(transactionId) : null,
      type,
      action,
      amount,
      balanceBefore,
      balanceAfter,
      reason,
      ipAddress,
      userAgent,
      metadata,
      flagged,
      flagReason,
      verificationStatus,
      createdAt: new Date()
    });

    await audit.save();

    // If flagged, also create a dispute tracker entry
    if (flagged && type === 'suspicious_activity') {
      await createDisputeEntry({
        userId,
        type: 'suspicious_behavior',
        description: `Suspicious wallet activity: ${reason}`,
        severity: 'medium',
        evidence: {
          metadata: {
            auditId: audit._id,
            amount,
            balanceChange: balanceAfter - balanceBefore,
            ipAddress,
            userAgent
          }
        },
        request,
        autoFlag: true
      });
    }

    console.log(`✅ Wallet audit created: ${type} - ${action} ${amount} for user ${userId}`);
    return audit;

  } catch (error) {
    console.error('❌ Error creating wallet audit:', error);
    throw error;
  }
}

/**
 * Creates a dispute tracker entry
 */
export async function createDisputeEntry({
  userId,
  type,
  matchId = null,
  transactionId = null,
  description,
  severity = 'medium',
  evidence = {},
  request = null,
  autoFlag = false
}: {
  userId: string;
  type: 'conflict' | 'cancel_request' | 'repeated_dispute' | 'suspicious_behavior' | 'fake_proof' | 'payment_dispute';
  matchId?: string | null;
  transactionId?: string | null;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  evidence?: any;
  request?: NextRequest | null;
  autoFlag?: boolean;
}) {
  try {
    await dbConnect();

    // Extract IP and User Agent from request if available
    const ipAddress = request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown';
    const userAgent = request?.headers.get('user-agent') || null;

    // Calculate dispute frequency
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const existingDisputes = await DisputeTracker.find({
      userId: new mongoose.Types.ObjectId(userId)
    });

    const totalDisputes = existingDisputes.length + 1;
    const disputesThisWeek = existingDisputes.filter(d => d.createdAt >= oneWeekAgo).length + 1;
    const disputesThisMonth = existingDisputes.filter(d => d.createdAt >= oneMonthAgo).length + 1;

    // Calculate risk score based on frequency and type
    let riskScore = 0;
    
    // Base score by type
    const typeScores = {
      'conflict': 15,
      'cancel_request': 10,
      'repeated_dispute': 25,
      'suspicious_behavior': 30,
      'fake_proof': 40,
      'payment_dispute': 20
    };
    riskScore += typeScores[type] || 10;

    // Frequency penalties
    if (disputesThisWeek > 3) riskScore += 20;
    if (disputesThisMonth > 10) riskScore += 30;
    if (totalDisputes > 20) riskScore += 25;

    // Severity multiplier
    const severityMultipliers = {
      'low': 1,
      'medium': 1.5,
      'high': 2,
      'critical': 3
    };
    riskScore *= severityMultipliers[severity];

    riskScore = Math.min(100, Math.round(riskScore));

    // Auto-flag high risk users
    const shouldAutoFlag = autoFlag || riskScore > 60 || disputesThisWeek > 5;

    const dispute = new DisputeTracker({
      userId: new mongoose.Types.ObjectId(userId),
      type,
      matchId: matchId ? new mongoose.Types.ObjectId(matchId) : null,
      transactionId: transactionId ? new mongoose.Types.ObjectId(transactionId) : null,
      description,
      severity,
      evidence,
      ipAddress,
      userAgent,
      frequency: {
        totalDisputes,
        disputesThisMonth,
        disputesThisWeek,
        lastDisputeDate: now
      },
      riskScore,
      autoFlagged: shouldAutoFlag,
      createdAt: now
    });

    await dispute.save();

    // Auto-flag user if risk score is too high
    if (riskScore > 80) {
      await User.findByIdAndUpdate(userId, {
        $set: {
          flagged: true,
          flagReason: `High risk score (${riskScore}) due to dispute pattern`,
          flaggedAt: now
        }
      });
    }

    console.log(`🚨 Dispute tracker created: ${type} - Risk Score: ${riskScore} for user ${userId}`);
    return dispute;

  } catch (error) {
    console.error('❌ Error creating dispute entry:', error);
    throw error;
  }
}

/**
 * Checks if a user has suspicious activity patterns
 */
export async function checkSuspiciousActivity(userId: string): Promise<{
  isSuspicious: boolean;
  riskScore: number;
  reasons: string[];
}> {
  try {
    await dbConnect();

    const reasons: string[] = [];
    let riskScore = 0;

    // Check recent disputes
    const recentDisputes = await DisputeTracker.find({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (recentDisputes.length > 3) {
      reasons.push(`${recentDisputes.length} disputes in the last week`);
      riskScore += 30;
    }

    // Check wallet audit flags
    const flaggedAudits = await WalletAudit.find({
      userId: new mongoose.Types.ObjectId(userId),
      flagged: true,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (flaggedAudits.length > 0) {
      reasons.push(`${flaggedAudits.length} flagged wallet activities in the last 24 hours`);
      riskScore += flaggedAudits.length * 10;
    }

    // Check for rapid balance changes
    const recentAudits = await WalletAudit.find({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    if (recentAudits.length > 20) {
      reasons.push(`${recentAudits.length} wallet transactions in the last hour`);
      riskScore += 25;
    }

    const isSuspicious = riskScore > 40 || reasons.length > 2;

    return {
      isSuspicious,
      riskScore: Math.min(100, riskScore),
      reasons
    };

  } catch (error) {
    console.error('❌ Error checking suspicious activity:', error);
    return { isSuspicious: false, riskScore: 0, reasons: [] };
  }
}

/**
 * Updates user balance with full audit trail
 */
export async function secureBalanceUpdate({
  userId,
  amount,
  type,
  reason,
  adminId = null,
  transactionId = null,
  request = null,
  metadata = {}
}: {
  userId: string;
  amount: number;
  type: 'balance_change' | 'manual_adjustment' | 'refund' | 'winnings' | 'entry_fee';
  reason: string;
  adminId?: string | null;
  transactionId?: string | null;
  request?: NextRequest | null;
  metadata?: any;
}): Promise<{ success: boolean; newBalance: number; audit: any }> {
  try {
    await dbConnect();

    // Get current balance
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const balanceBefore = user.balance;
    const action = amount > 0 ? 'credit' : 'debit';
    
    // Check for suspicious patterns before update
    const suspiciousCheck = await checkSuspiciousActivity(userId);
    if (suspiciousCheck.isSuspicious && Math.abs(amount) > 100) {
      // Create suspicious activity audit
      await createWalletAudit({
        userId,
        adminId,
        transactionId,
        type: 'suspicious_activity',
        action,
        amount: Math.abs(amount),
        balanceBefore,
        balanceAfter: balanceBefore + amount,
        reason: `BLOCKED: ${reason} - Suspicious patterns detected: ${suspiciousCheck.reasons.join(', ')}`,
        request,
        metadata: { ...metadata, suspiciousCheck },
        autoFlag: true
      });

      throw new Error('Transaction blocked due to suspicious activity patterns');
    }

    // Update balance
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error('Failed to update user balance');
    }

    const balanceAfter = updatedUser.balance;

    // Create audit trail
    const audit = await createWalletAudit({
      userId,
      adminId,
      transactionId,
      type,
      action,
      amount: Math.abs(amount),
      balanceBefore,
      balanceAfter,
      reason,
      request,
      metadata
    });

    return {
      success: true,
      newBalance: balanceAfter,
      audit
    };

  } catch (error) {
    console.error('❌ Error in secure balance update:', error);
    throw error;
  }
}
