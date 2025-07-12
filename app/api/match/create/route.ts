import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authUser = requireAuth(request);

    const { entryFee, roomCode } = await request.json();

    if (!entryFee || !roomCode) {
      return NextResponse.json(
        { error: 'Entry fee and room code are required' },
        { status: 400 }
      );
    }

    if (entryFee < 1) {
      return NextResponse.json(
        { error: 'Entry fee must be at least 1 coin' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Check user balance
    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.balance < entryFee) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Calculate pot and platform cut
    const pot = entryFee * 2;
    const platformCut = Math.floor(pot * 0.1); // 10% platform commission

    // Process match creation without transactions (for local development)
    try {
      // Deduct entry fee from player1
      await User.findByIdAndUpdate(
        authUser.userId,
        { $inc: { balance: -entryFee } }
      );

      // Create match fee transaction (system transaction)
      await Transaction.create({
        userId: null, // System transaction - no upiId required
        type: 'withdrawal',
        amount: entryFee,
        status: 'approved',
        description: `Match entry fee - User: ${authUser.userId}`,
      });

      // Create match
      const match = await Match.create({
        player1: authUser.userId,
        entryFee,
        pot,
        platformCut,
        roomCode,
        status: 'waiting',
      });

      // Populate player1 data
      await match.populate('player1', 'name phone');

      return NextResponse.json({
        message: 'Match created successfully',
        match: {
          id: match._id,
          player1: match.player1,
          entryFee: match.entryFee,
          pot: match.pot,
          roomCode: match.roomCode,
          status: match.status,
          createdAt: match.createdAt,
        },
      });

    } catch (error) {
      console.error('Match creation transaction error:', error);
      throw error;
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Create match error:', error);
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}
