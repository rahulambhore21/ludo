import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import WalletAction from '@/models/WalletAction';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminUser = await requireAdminAuth(request);

    const { userId, type, amount, reason } = await request.json();

    if (!userId || !type || !amount || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['add', 'deduct'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if deduction is possible
    if (type === 'deduct' && user.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance for deduction' },
        { status: 400 }
      );
    }

    const balanceBefore = user.balance;
    const balanceAfter = type === 'add' ? balanceBefore + amount : balanceBefore - amount;

    // Update user balance
    await User.findByIdAndUpdate(userId, {
      balance: balanceAfter
    });

    // Create wallet action record
    await WalletAction.create({
      userId,
      adminId: adminUser.userId,
      type: type === 'add' ? 'manual_add' : 'manual_deduct',
      amount,
      reason,
      balanceBefore,
      balanceAfter
    });

    return NextResponse.json({
      message: `Successfully ${type === 'add' ? 'added' : 'deducted'} ₹${amount} ${type === 'add' ? 'to' : 'from'} user's wallet`,
      balanceBefore,
      balanceAfter
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('Wallet action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform wallet action' },
      { status: 500 }
    );
  }
}
