import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Alert Schema
const AlertSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['error', 'warning', 'info'], 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['system', 'bet', 'match', 'user', 'payment'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  details: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: Date,
});

const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    // Sample alerts for testing
    const sampleAlerts = [
      {
        type: 'error',
        category: 'system',
        title: 'Database Connection Failed',
        message: 'Failed to connect to MongoDB after 3 retry attempts',
        details: {
          error: 'Connection timeout',
          retryCount: 3,
          lastAttempt: new Date()
        }
      },
      {
        type: 'warning',
        category: 'bet',
        title: 'High Value Bet Detected',
        message: 'User placed a bet of ₹5000, which exceeds the normal threshold',
        details: {
          userId: '507f1f77bcf86cd799439011',
          amount: 5000,
          threshold: 1000
        }
      },
      {
        type: 'error',
        category: 'payment',
        title: 'Payment Gateway Error',
        message: 'Payment processing failed for multiple transactions',
        details: {
          failedCount: 15,
          timeframe: '30 minutes',
          gateway: 'Razorpay'
        }
      },
      {
        type: 'warning',
        category: 'match',
        title: 'Match Abandoned',
        message: 'Match has been idle for over 2 hours without completion',
        details: {
          matchId: '507f1f77bcf86cd799439012',
          duration: '2h 15m',
          lastActivity: new Date(Date.now() - 2.25 * 60 * 60 * 1000)
        }
      },
      {
        type: 'info',
        category: 'user',
        title: 'New User Registration Spike',
        message: '50 new users registered in the last hour',
        details: {
          count: 50,
          timeframe: '1 hour',
          averagePerHour: 10
        }
      }
    ];

    // Insert sample alerts
    const result = await Alert.insertMany(sampleAlerts);

    return NextResponse.json({
      success: true,
      message: `${result.length} sample alerts created`,
      alerts: result
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('Create sample alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to create sample alerts' },
      { status: 500 }
    );
  }
}
