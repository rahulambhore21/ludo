import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminUser = await requireAdminAuth(request);

    const { userId, amount, type, reason } = await request.json();

    if (!userId || !amount || !type || !reason) {
      return NextResponse.json(
        { error: 'User ID, amount, type, and reason are required' },
        { status: 400 }
      );
    }

    if (!['add', 'deduct'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "add" or "deduct"' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // Validate that the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the user
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

    // Calculate the change amount
    const changeAmount = type === 'add' ? amount : -amount;

    // Update user balance
    await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: changeAmount } }
    );

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: type === 'add' ? 'admin-credit' : 'admin-debit',
      amount: amount,
      status: 'approved',
      description: `Admin ${type}: ${reason}`,
      adminId: adminUser.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await transaction.save();

    // Fetch updated user data
    const updatedUser = await User.findById(userId)
      .select('name phone balance')
      .lean();

    return NextResponse.json({
      message: `Successfully ${type === 'add' ? 'added' : 'deducted'} ${amount} coins`,
      user: updatedUser,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
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

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.error('Admin refund error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
