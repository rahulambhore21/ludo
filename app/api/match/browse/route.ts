import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authUser = requireAuth(request);

    // Connect to database
    await dbConnect();

    // Get all waiting matches (excluding user's own matches)
    const matches = await Match.find({
      status: 'waiting',
      player1: { $ne: authUser.userId }, // Exclude user's own matches
    })
      .populate('player1', 'name phone')
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    const matchesWithInfo = matches.map(match => ({
      id: match._id,
      player1: match.player1,
      entryFee: match.entryFee,
      pot: match.pot,
      roomCode: match.roomCode,
      status: match.status,
      createdAt: match.createdAt,
    }));

    return NextResponse.json({
      matches: matchesWithInfo,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Browse matches error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}
