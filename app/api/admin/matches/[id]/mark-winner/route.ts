import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const adminUser = await requireAdminAuth(request);

    const { id: matchId } = await params;
    const { winnerId, reason } = await request.json();

    if (!matchId || !winnerId) {
      return NextResponse.json(
        { error: 'Match ID and winner ID are required' },
        { status: 400 }
      );
    }

    // Validate that the IDs are valid MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(matchId) || !mongoose.Types.ObjectId.isValid(winnerId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
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

    // Check if match can be resolved
    if (match.status === 'completed' || match.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Match is already completed or cancelled' },
        { status: 400 }
      );
    }

    // Validate winner is one of the players
    const isPlayer1Winner = match.player1.toString() === winnerId;
    const isPlayer2Winner = match.player2?.toString() === winnerId;

    if (!isPlayer1Winner && !isPlayer2Winner) {
      return NextResponse.json(
        { error: 'Winner must be one of the match players' },
        { status: 400 }
      );
    }

    // Calculate winnings (pot minus platform cut)
    const winnings = match.pot - match.platformCut;

    // Award winnings to winner
    await User.findByIdAndUpdate(
      winnerId,
      { $inc: { balance: winnings } }
    );

    // Handle referral rewards if applicable
    const winner = await User.findById(winnerId);
    if (winner?.referredBy && match.entryFee >= 50) {
      // 1% of the pot as referral reward for matches with entry fee >= 50
      const referralReward = Math.floor(match.pot * 0.01);
      await User.findByIdAndUpdate(
        winner.referredBy,
        { $inc: { balance: referralReward } }
      );
    }

    // Update match with winner and completion details
    const updateData: any = {
      winner: winnerId,
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    // Set player results
    if (isPlayer1Winner) {
      updateData.player1Result = 'win';
      updateData.player2Result = 'loss';
    } else {
      updateData.player1Result = 'loss';
      updateData.player2Result = 'win';
    }

    await Match.findByIdAndUpdate(matchId, updateData);

    // Fetch updated match data
    const updatedMatch = await Match.findById(matchId)
      .populate('player1', 'name phone balance')
      .populate('player2', 'name phone balance')
      .populate('winner', 'name phone balance')
      .lean();

    return NextResponse.json({
      message: 'Winner assigned successfully',
      match: updatedMatch,
      winnings,
      adminAction: {
        type: 'manual_winner_assignment',
        adminId: adminUser.userId,
        reason: reason || 'Manual assignment by admin',
        timestamp: new Date(),
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

    console.error('Admin mark winner error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
