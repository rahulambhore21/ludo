import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    const { id: userId } = await params;
    const { amount } = await request.json();

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid user ID and amount are required' },
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

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Process coin addition without MongoDB sessions (for local development)
    try {
      // Add coins to user balance
      await User.findByIdAndUpdate(
        userId,
        { $inc: { balance: amount } }
      );

      // Create a transaction record
      await Transaction.create({
        userId: userId,
        type: 'deposit',
        amount: amount,
        status: 'approved',
        description: 'Manual admin top-up',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Get updated user
      const updatedUser = await User.findById(userId).select('-__v').lean();

      return NextResponse.json({
        message: `Successfully added ${amount} coins to ${user.name}`,
        user: updatedUser,
      });

    } catch (error) {
      console.error('Add coins error:', error);
      throw error;
    }

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

    console.error('Admin add coins error:', error);
    return NextResponse.json(
      { error: 'Failed to add coins to user' },
      { status: 500 }
    );
  }
}
