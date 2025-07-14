import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import CancelRequest from '@/models/CancelRequest';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const adminUser = await requireAdminAuth(request);

    const { id: matchId } = await params;
    const { reason } = await request.json();

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

    // Find the match
    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if match can be cancelled
    if (match.status === 'completed' || match.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Match is already completed or cancelled' },
        { status: 400 }
      );
    }

    // Refund both players
    const refunds = [];

    // Refund player1
    await User.findByIdAndUpdate(
      match.player1,
      { $inc: { balance: match.entryFee } }
    );
    refunds.push({ playerId: match.player1, amount: match.entryFee });

    // Refund player2 if exists
    if (match.player2) {
      await User.findByIdAndUpdate(
        match.player2,
        { $inc: { balance: match.entryFee } }
      );
      refunds.push({ playerId: match.player2, amount: match.entryFee });
    }

    // Update match status
    await Match.findByIdAndUpdate(
      matchId,
      {
        status: 'cancelled',
        updatedAt: new Date(),
      }
    );

    // Update any pending cancel requests for this match
    await CancelRequest.updateMany(
      { matchId, status: 'pending' },
      {
        status: 'approved',
        reviewedBy: adminUser.userId,
        reviewNote: reason || 'Approved by admin',
        updatedAt: new Date(),
      }
    );

    // Fetch updated match data
    const updatedMatch = await Match.findById(matchId)
      .populate('player1', 'name phone balance')
      .populate('player2', 'name phone balance')
      .lean();

    return NextResponse.json({
      message: 'Match cancelled and players refunded successfully',
      match: updatedMatch,
      refunds,
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

    console.error('Admin approve cancel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
