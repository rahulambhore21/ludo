import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authUser = requireAuth(request);

    // Connect to database
    await dbConnect();

    // Get user's referral info
    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get referred users
    const referredUsers = await User.find({ referredBy: authUser.userId })
      .select('name phone createdAt')
      .sort({ createdAt: -1 });

    // Get referral reward transactions with match details
    const referralRewards = await Transaction.find({
      userId: authUser.userId,
      type: 'referral-reward'
    })
      .populate('matchId', 'pot entryFee createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate total referral earnings
    const totalEarnings = referralRewards.reduce((sum, transaction) => 
      sum + transaction.amount, 0
    );

    return NextResponse.json({
      referralCode: user.referralCode,
      referredUsers: referredUsers.map(u => ({
        id: u._id,
        name: u.name,
        phone: u.phone.replace(/(\d{6})(\d{4})/, '$1****'),
        joinedAt: u.createdAt,
      })),
      recentRewards: referralRewards.map(t => ({
        id: t._id,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt,
        matchId: t.matchId?._id || null,
        matchPot: t.matchId?.pot || null,
        matchEntryFee: t.matchId?.entryFee || null,
      })),
      totalEarnings,
      totalReferrals: referredUsers.length,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get referrals error:', error);
    return NextResponse.json(
      { error: 'Failed to get referral data' },
      { status: 500 }
    );
  }
}
