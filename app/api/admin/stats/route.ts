import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Match from '@/models/Match';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    // Get current date for today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all statistics in parallel
    const [
      totalUsers,
      totalCoinsInSystem,
      platformEarnings,
      conflictsPending,
      transactionsToday,
      pendingDeposits,
      pendingWithdrawals,
    ] = await Promise.all([
      // Total users
      User.countDocuments(),

      // Total coins in system (sum of all user balances)
      User.aggregate([
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]).then(result => result[0]?.total || 0),

      // Platform earnings (from match cuts)
      Transaction.aggregate([
        { 
          $match: { 
            userId: { $exists: false }, // System transactions (platform cuts)
            type: 'deposit' // Platform earnings are recorded as deposits
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0),

      // Matches with conflict status
      Match.countDocuments({ status: 'conflict' }),

      // Transactions created today
      Transaction.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      }),

      // Pending deposits
      Transaction.countDocuments({
        type: 'deposit',
        status: 'pending'
      }),

      // Pending withdrawals
      Transaction.countDocuments({
        type: 'withdrawal',
        status: 'pending'
      }),
    ]);

    const stats = {
      totalUsers,
      totalCoinsInSystem,
      totalPlatformEarnings: platformEarnings,
      conflictsPending,
      transactionsToday,
      pendingDeposits,
      pendingWithdrawals,
    };

    return NextResponse.json({
      stats,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
