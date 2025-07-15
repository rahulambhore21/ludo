import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    const { minutesThreshold = 90 } = await request.json();

    // Calculate cutoff time (matches older than X minutes)
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesThreshold);

    // Find matches that should be abandoned
    const idleMatches = await Match.find({
      status: { $in: ['waiting', 'active'] },
      createdAt: { $lt: cutoffTime }
    }).populate('player1 player2', 'name phone balance');

    const abandonedMatches = [];
    
    for (const match of idleMatches) {
      try {
        // Refund entry fees to both players
        if (match.player1) {
          await User.findByIdAndUpdate(
            match.player1._id,
            { $inc: { balance: match.entryFee } }
          );

          // Create refund transaction for player1
          await Transaction.create({
            userId: match.player1._id,
            type: 'refund',
            amount: match.entryFee,
            status: 'approved',
            description: `Auto-refund for abandoned match ${match.roomCode} (idle >${minutesThreshold}min)`,
            matchId: match._id
          });
        }

        if (match.player2) {
          await User.findByIdAndUpdate(
            match.player2._id,
            { $inc: { balance: match.entryFee } }
          );

          // Create refund transaction for player2
          await Transaction.create({
            userId: match.player2._id,
            type: 'refund',
            amount: match.entryFee,
            status: 'approved',
            description: `Auto-refund for abandoned match ${match.roomCode} (idle >${minutesThreshold}min)`,
            matchId: match._id
          });
        }

        // Update match status to abandoned
        await Match.findByIdAndUpdate(match._id, {
          status: 'abandoned',
          abandonedAt: new Date(),
          abandonReason: `Auto-abandoned: idle for more than ${minutesThreshold} minutes`
        });

        abandonedMatches.push({
          matchId: match._id,
          roomCode: match.roomCode,
          player1: match.player1?.name,
          player2: match.player2?.name,
          entryFee: match.entryFee,
          idleMinutes: Math.floor((new Date().getTime() - match.createdAt.getTime()) / (1000 * 60))
        });

      } catch (error) {
        console.error(`Error abandoning match ${match._id}:`, error);
      }
    }

    return NextResponse.json({
      message: `Successfully abandoned ${abandonedMatches.length} idle matches`,
      abandonedMatches,
      threshold: minutesThreshold
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('Auto-abandon matches error:', error);
    return NextResponse.json(
      { error: 'Failed to abandon idle matches' },
      { status: 500 }
    );
  }
}

// Get current idle matches
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const minutesThreshold = parseInt(searchParams.get('threshold') || '30');

    // Calculate cutoff time
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesThreshold);

    // Find idle matches
    const idleMatches = await Match.find({
      status: { $in: ['waiting', 'active'] },
      createdAt: { $lt: cutoffTime }
    })
    .populate('player1 player2', 'name phone')
    .sort({ createdAt: -1 });

    const matchesWithIdleTime = idleMatches.map(match => ({
      ...match.toObject(),
      idleMinutes: Math.floor((new Date().getTime() - match.createdAt.getTime()) / (1000 * 60))
    }));

    return NextResponse.json({
      idleMatches: matchesWithIdleTime,
      threshold: minutesThreshold,
      count: idleMatches.length
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('Get idle matches error:', error);
    return NextResponse.json(
      { error: 'Failed to get idle matches' },
      { status: 500 }
    );
  }
}
