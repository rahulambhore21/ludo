import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const match = await Match.findById(matchId)
      .populate('player1', 'name phone')
      .populate('player2', 'name phone')
      .populate('winner', 'name phone')
      .select('-__v')
      .lean() as any;

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if user is part of this match or can view it
    const isPlayer1 = match.player1._id.toString() === authUser.userId;
    const isPlayer2 = match.player2?._id.toString() === authUser.userId;
    const canViewMatch = isPlayer1 || isPlayer2 || match.status === 'waiting';

    if (!canViewMatch) {
      return NextResponse.json(
        { error: 'You do not have permission to view this match' },
        { status: 403 }
      );
    }

    // Add user-specific information
    let userRole = null;
    let userResult = null;
    let opponentResult = null;
    let opponent = null;
    let isWinner = false;

    if (isPlayer1) {
      userRole = 'player1';
      userResult = match.player1Result;
      opponentResult = match.player2Result;
      opponent = match.player2;
      isWinner = match.winner?._id.toString() === authUser.userId;
    } else if (isPlayer2) {
      userRole = 'player2';
      userResult = match.player2Result;
      opponentResult = match.player1Result;
      opponent = match.player1;
      isWinner = match.winner?._id.toString() === authUser.userId;
    }

    const matchWithUserInfo = {
      ...match,
      userRole,
      userResult,
      opponentResult,
      opponent,
      isWinner,
      canJoin: match.status === 'waiting' && !isPlayer1 && !isPlayer2,
      canSubmitResult: (isPlayer1 || isPlayer2) && match.status === 'in-progress',
      userPayout: isWinner ? (match.pot - match.platformCut) : 0,
    };

    return NextResponse.json({
      match: matchWithUserInfo,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get match error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    );
  }
}
