import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { createDisputeEntry } from '@/lib/securityUtils';
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

    // Parse request based on content type
    let result: string;
    let screenshotUrl: string | null = null;

    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (when screenshot is included)
      const formData = await request.formData();
      result = formData.get('result') as string;
      const screenshotFile = formData.get('screenshot') as File | null;

      if (!result || !['win', 'loss'].includes(result)) {
        return NextResponse.json(
          { error: 'Result must be either "win" or "loss"' },
          { status: 400 }
        );
      }

      // For win claims, screenshot is required
      if (result === 'win') {
        if (!screenshotFile) {
          return NextResponse.json(
            { error: 'Screenshot proof is required for win claims' },
            { status: 400 }
          );
        }

        // Upload screenshot to Cloudinary
        try {
          const bytes = await screenshotFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const fileName = `match-result-${matchId}-${authUser.userId}-${Date.now()}`;
          screenshotUrl = await uploadToCloudinary(buffer, fileName);
        } catch (uploadError) {
          console.error('Screenshot upload error:', uploadError);
          return NextResponse.json(
            { error: 'Failed to upload screenshot. Please try again.' },
            { status: 500 }
          );
        }
      }
    } else {
      // Handle JSON (for loss submissions)
      const body = await request.json();
      result = body.result;

      if (!result || !['win', 'loss'].includes(result)) {
        return NextResponse.json(
          { error: 'Result must be either "win" or "loss"' },
          { status: 400 }
        );
      }

      // Require screenshot for win claims even in JSON mode
      if (result === 'win') {
        return NextResponse.json(
          { error: 'Screenshot proof is required for win claims. Please use the file upload method.' },
          { status: 400 }
        );
      }
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

    // Update the match with the result and screenshot
    const updateData: any = {};
    
    if (isPlayer1) {
      updateData.player1Result = result;
      if (screenshotUrl) {
        updateData.player1Screenshot = screenshotUrl;
      }
    } else {
      updateData.player2Result = result;
      if (screenshotUrl) {
        updateData.player2Screenshot = screenshotUrl;
      }
    }

    await Match.findByIdAndUpdate(matchId, updateData);

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
        winner: updatedMatch?.winner,
      },
      winnings: 0, // This will be updated when both results are processed
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

    if (!resultsMatch) {
      // Results conflict - mark as disputed and create dispute entries
      await Match.findByIdAndUpdate(match._id, {
        status: 'conflict',
        updatedAt: new Date(),
      });

      // Create dispute tracker entries for both players
      const conflictDescription = `Match result conflict: Player1 claims ${match.player1Result}, Player2 claims ${match.player2Result}`;
      
      // Track dispute for player1
      await createDisputeEntry({
        userId: match.player1.toString(),
        type: 'conflict',
        matchId: match._id.toString(),
        description: `${conflictDescription} (Player1 perspective)`,
        severity: 'medium',
        evidence: {
          screenshots: [match.player1Screenshot].filter(Boolean),
          metadata: {
            playerRole: 'player1',
            claimedResult: match.player1Result,
            opponentResult: match.player2Result,
            matchEntryFee: match.entryFee,
            roomCode: match.roomCode
          }
        }
      });

      // Track dispute for player2
      await createDisputeEntry({
        userId: match.player2.toString(),
        type: 'conflict',
        matchId: match._id.toString(),
        description: `${conflictDescription} (Player2 perspective)`,
        severity: 'medium',
        evidence: {
          screenshots: [match.player2Screenshot].filter(Boolean),
          metadata: {
            playerRole: 'player2',
            claimedResult: match.player2Result,
            opponentResult: match.player1Result,
            matchEntryFee: match.entryFee,
            roomCode: match.roomCode
          }
        }
      });

      console.log(`🚨 Match conflict detected: ${match._id} - Both players claim different results`);
      return; // Don't process winnings, let admin resolve
    }

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
