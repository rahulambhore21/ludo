import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    const { id: matchId } = await params;
    const { action } = await request.json();

    if (!matchId || !['player1-wins', 'player2-wins', 'reject-both'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid match ID or action' },
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
    const match = await Match.findById(matchId)
      .populate('player1', 'name phone')
      .populate('player2', 'name phone');

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if match is in conflict status
    if (match.status !== 'conflict') {
      return NextResponse.json(
        { error: 'Match is not in conflict status' },
        { status: 400 }
      );
    }

    // Process match resolution without MongoDB sessions (for local development)
    try {
      let winnerId = null;
      let winnings = 0;
      let description = '';

      if (action === 'player1-wins') {
        winnerId = match.player1._id;
        winnings = match.pot - match.platformCut;
        description = `Match resolved by admin: ${match.player1.name} declared winner`;

        // Credit winnings to player 1
        await User.findByIdAndUpdate(
          match.player1._id,
          { $inc: { balance: winnings } }
        );

        // Update match
        await Match.findByIdAndUpdate(
          matchId,
          {
            status: 'completed',
            winner: match.player1._id,
            player1Result: 'win',
            player2Result: 'loss',
            updatedAt: new Date(),
          }
        );

      } else if (action === 'player2-wins') {
        winnerId = match.player2._id;
        winnings = match.pot - match.platformCut;
        description = `Match resolved by admin: ${match.player2.name} declared winner`;

        // Credit winnings to player 2
        await User.findByIdAndUpdate(
          match.player2._id,
          { $inc: { balance: winnings } }
        );

        // Update match
        await Match.findByIdAndUpdate(
          matchId,
          {
            status: 'completed',
            winner: match.player2._id,
            player1Result: 'loss',
            player2Result: 'win',
            updatedAt: new Date(),
          }
        );

      } else if (action === 'reject-both') {
        description = 'Match rejected by admin: Entry fees refunded to both players';

        // Refund entry fee to both players
        await User.findByIdAndUpdate(
          match.player1._id,
          { $inc: { balance: match.entryFee } }
        );

        await User.findByIdAndUpdate(
          match.player2._id,
          { $inc: { balance: match.entryFee } }
        );

        // Update match
        await Match.findByIdAndUpdate(
          matchId,
          {
            status: 'cancelled',
            updatedAt: new Date(),
          }
        );
      }

      // Create transaction records for winning/refunding
      if (action === 'player1-wins' || action === 'player2-wins') {
        // Record match winnings
        await Transaction.create({
          userId: winnerId,
          type: 'deposit',
          amount: winnings,
          status: 'approved',
          description: `Match winnings: ${description}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Record platform cut (system transaction)
        await Transaction.create({
          userId: null, // System transaction
          type: 'deposit',
          amount: match.platformCut,
          status: 'approved',
          description: `Platform commission from match ${matchId}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      } else if (action === 'reject-both') {
        // Record refunds
        await Transaction.create({
          userId: match.player1._id,
          type: 'deposit',
          amount: match.entryFee,
          status: 'approved',
          description: `Refund: ${description}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await Transaction.create({
          userId: match.player2._id,
          type: 'deposit',
          amount: match.entryFee,
          status: 'approved',
          description: `Refund: ${description}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Get updated match
      const updatedMatch = await Match.findById(matchId)
        .populate('player1', 'name phone')
        .populate('player2', 'name phone')
        .populate('winner', 'name phone')
        .select('-__v')
        .lean();

      return NextResponse.json({
        message: 'Match conflict resolved successfully',
        match: updatedMatch,
      });

    } catch (error) {
      console.error('Match resolution error:', error);
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

    console.error('Admin resolve match error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve match conflict' },
      { status: 500 }
    );
  }
}
