import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require authentication
    const authUser = requireAuth(request);
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

    // Find the match
    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if match is available for joining
    if (match.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Match is not available for joining' },
        { status: 400 }
      );
    }

    // Check if user is trying to join their own match
    if (match.player1.toString() === authUser.userId) {
      return NextResponse.json(
        { error: 'Cannot join your own match' },
        { status: 400 }
      );
    }

    // Check if match already has player2
    if (match.player2) {
      return NextResponse.json(
        { error: 'Match is already full' },
        { status: 400 }
      );
    }

    // Check user balance
    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.balance < match.entryFee) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Process match joining without MongoDB sessions (for local development)
    try {
      // Deduct entry fee from player2
      await User.findByIdAndUpdate(
        authUser.userId,
        { $inc: { balance: -match.entryFee } }
      );

      // Create match fee transaction for player2 (system transaction)
      await Transaction.create({
        userId: null, // System transaction - no upiId required
        type: 'withdrawal',
        amount: match.entryFee,
        status: 'approved',
        description: `Match entry fee - User: ${authUser.userId}`,
      });

      // Update match with player2 and change status
      const updatedMatch = await Match.findByIdAndUpdate(
        matchId,
        {
          player2: authUser.userId,
          status: 'in-progress',
        },
        { new: true }
      )
        .populate('player1', 'name phone')
        .populate('player2', 'name phone');

      return NextResponse.json({
        message: 'Successfully joined match',
        match: {
          id: updatedMatch?._id,
          player1: updatedMatch?.player1,
          player2: updatedMatch?.player2,
          entryFee: updatedMatch?.entryFee,
          pot: updatedMatch?.pot,
          roomCode: updatedMatch?.roomCode,
          status: updatedMatch?.status,
          createdAt: updatedMatch?.createdAt,
        },
      });

    } catch (error) {
      console.error('Match joining error:', error);
      throw error;
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Join match error:', error);
    return NextResponse.json(
      { error: 'Failed to join match' },
      { status: 500 }
    );
  }
}
