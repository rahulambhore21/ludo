import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authUser = requireAuth(request);

    const { amount, upiId } = await request.json();

    if (!amount || !upiId) {
      return NextResponse.json(
        { error: 'Amount and UPI ID are required' },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is 10 coins' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Check user balance
    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Deduct amount from user balance immediately (reserved for withdrawal)
    await User.findByIdAndUpdate(
      authUser.userId,
      { $inc: { balance: -amount } }
    );

    // Create transaction record
    const transaction = new Transaction({
      userId: authUser.userId,
      type: 'withdrawal',
      amount,
      status: 'pending',
      upiId,
      description: 'Withdrawal request - amount reserved',
    });

    await transaction.save();

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        upiId: transaction.upiId,
        createdAt: transaction.createdAt,
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: 'Failed to submit withdrawal request' },
      { status: 500 }
    );
  }
}
