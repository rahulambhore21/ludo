import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authUser = requireAuth(request);

    // Connect to database
    await dbConnect();

    // Get user's transactions
    const transactions = await Transaction.find({ userId: authUser.userId })
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    return NextResponse.json({
      transactions,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get transaction history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 }
    );
  }
}
