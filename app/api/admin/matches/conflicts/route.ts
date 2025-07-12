import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    // Get all matches with conflict status
    const matches = await Match.find({ status: 'conflict' })
      .populate('player1', 'name phone')
      .populate('player2', 'name phone')
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    return NextResponse.json({
      matches,
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

    console.error('Admin get conflict matches error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflict matches' },
      { status: 500 }
    );
  }
}
