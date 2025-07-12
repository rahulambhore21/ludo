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

    const { result } = await request.json();

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

    if (!result || !['win', 'loss'].includes(result)) {
      return NextResponse.json(
        { error: 'Result must be either "win" or "loss"' },
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

    // Check if match is in progress
    if (match.status !== 'in-progress') {
      return NextResponse.json(
        { error: 'Match is not in progress' },
        { status: 400 }
      );
    }

    // Check if user is part of this match
    const isPlayer1 = match.player1.toString() === authUser.userId;
    const isPlayer2 = match.player2?.toString() === authUser.userId;
    
    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json(
        { error: 'You are not part of this match' },
        { status: 403 }
      );
    }

    // Check if user has already submitted result
    if (isPlayer1 && match.player1Result) {
      return NextResponse.json(
        { error: 'You have already submitted your result' },
        { status: 400 }
      );
    }

    if (isPlayer2 && match.player2Result) {
      return NextResponse.json(
        { error: 'You have already submitted your result' },
        { status: 400 }
      );
    }

    // Update the match with the result
    const updateField = isPlayer1 ? 'player1Result' : 'player2Result';
    await Match.findByIdAndUpdate(matchId, {
      [updateField]: result,
    });

    // Get updated match to check if both results are submitted
    const updatedMatch = await Match.findById(matchId);
    
    if (updatedMatch?.player1Result && updatedMatch?.player2Result) {
      // Both players have submitted results, now process
      await processMatchResults(updatedMatch);
    }

    return NextResponse.json({
      message: 'Result submitted successfully',
      match: {
        id: updatedMatch?._id,
        status: updatedMatch?.status,
        player1Result: updatedMatch?.player1Result,
        player2Result: updatedMatch?.player2Result,
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Submit result error:', error);
    return NextResponse.json(
      { error: 'Failed to submit result' },
      { status: 500 }
    );
  }
}

async function processMatchResults(match: any) {
  try {
    // Check if results are consistent (one win, one loss)
    const resultsMatch = (
      (match.player1Result === 'win' && match.player2Result === 'loss') ||
      (match.player1Result === 'loss' && match.player2Result === 'win')
    );

    if (resultsMatch) {
      // Results are consistent, settle the match
      const winnerId = match.player1Result === 'win' ? match.player1 : match.player2;
      const loserId = match.player1Result === 'win' ? match.player2 : match.player1;
      
      const winnings = match.pot - match.platformCut; // 90% of pot

      // Add winnings to winner's balance
      await User.findByIdAndUpdate(
        winnerId,
        { $inc: { balance: winnings } }
      );

      // Create win transaction
      await Transaction.create({
        userId: winnerId,
        type: 'match-winning',
        amount: winnings,
        status: 'approved',
        description: 'Match winnings',
        matchId: match._id,
      });

      // Handle referral rewards - 1% of pot to referrer if winner was referred
      const winner = await User.findById(winnerId).populate('referredBy', 'name phone');
      if (winner?.referredBy) {
        const referralReward = Math.round(match.pot * 0.01); // 1% of total pot
        
        // Add referral reward to referrer's balance
        await User.findByIdAndUpdate(
          winner.referredBy._id,
          { $inc: { balance: referralReward } }
        );

        // Create referral reward transaction
        await Transaction.create({
          userId: winner.referredBy._id,
          type: 'referral-reward',
          amount: referralReward,
          status: 'approved',
          description: `Referral reward: ${winner.name} won ₹${match.pot} match`,
          matchId: match._id,
        });

        console.log(`🎁 Referral reward: ₹${referralReward} given to ${winner.referredBy.name} for ${winner.name}'s victory (1% of ₹${match.pot} pot)`);
      }

      // Create platform cut transaction (system profit)
      await Transaction.create({
        userId: null, // System transaction
        type: 'match-deduction',
        amount: match.platformCut,
        status: 'approved',
        description: 'Platform commission',
        matchId: match._id,
      });

      // Update match status
      await Match.findByIdAndUpdate(
        match._id,
        {
          winner: winnerId,
          status: 'completed',
        }
      );

    } else {
      // Results don't match, mark as conflict
      await Match.findByIdAndUpdate(
        match._id,
        { status: 'conflict' }
      );
    }

  } catch (error) {
    console.error('Process match results error:', error);
    throw error;
  }
}
