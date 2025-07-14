import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import CancelRequest from '@/models/CancelRequest';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    const { id: matchId } = await params;

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    // Validate that the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return NextResponse.json(
        { error: 'Invalid match ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get match details with populated fields
    const match = await Match.findById(matchId)
      .populate('player1', 'name phone balance')
      .populate('player2', 'name phone balance')
      .populate('winner', 'name phone')
      .lean();

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Get cancel requests for this match
    const cancelRequests = await CancelRequest.find({ matchId })
      .populate('requestedBy', 'name phone')
      .populate('reviewedBy', 'name phone')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      match,
      cancelRequests,
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

    console.error('Admin get match details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
