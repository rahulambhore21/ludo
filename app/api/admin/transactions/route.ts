import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    // Get all transactions with user details
    const transactions = await Transaction.find()
      .populate('userId', 'name phone')
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

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.error('Admin get transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
