import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authUser = requireAuth(request);

    // Connect to database
    await dbConnect();

    // Get user's matches
    const matches = await Match.find({
      $or: [
        { player1: authUser.userId },
        { player2: authUser.userId },
      ],
    })
      .populate('player1', 'name phone')
      .populate('player2', 'name phone')
      .populate('winner', 'name phone')
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    // Add user-specific information to each match
    const matchesWithUserInfo = matches.map(match => {
      const isPlayer1 = match.player1._id.toString() === authUser.userId;
      const userResult = isPlayer1 ? match.player1Result : match.player2Result;
      const opponentResult = isPlayer1 ? match.player2Result : match.player1Result;
      const opponent = isPlayer1 ? match.player2 : match.player1;
      const isWinner = match.winner?._id.toString() === authUser.userId;

      return {
        ...match,
        userRole: isPlayer1 ? 'player1' : 'player2',
        userResult,
        opponentResult,
        opponent,
        isWinner,
        userPayout: isWinner ? (match.pot - match.platformCut) : 0,
      };
    });

    // Calculate statistics
    const completedMatches = matchesWithUserInfo.filter(match => (match as any).status === 'completed');
    const wonMatches = completedMatches.filter(match => match.isWinner);
    const lostMatches = completedMatches.filter(match => !match.isWinner);
    
    const totalWinnings = wonMatches.reduce((sum, match) => sum + match.userPayout, 0);
    const totalLosses = lostMatches.reduce((sum, match) => sum + (match as any).entryFee, 0);

    const stats = {
      totalMatches: completedMatches.length,
      wonMatches: wonMatches.length,
      lostMatches: lostMatches.length,
      totalWinnings,
      totalLosses,
      netProfit: totalWinnings - totalLosses,
    };

    return NextResponse.json({
      matches: matchesWithUserInfo,
      stats,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get user match history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match history' },
      { status: 500 }
    );
  }
}
