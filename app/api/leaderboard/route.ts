
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Match from '@/models/Match';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authUser = requireAuth(request);

    // Connect to database
    await dbConnect();

    // Get all users with their stats
    const users = await User.find()
      .select('name phone balance')
      .lean();

    // Calculate stats for each user
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        // Get all completed matches for this user
        const completedMatches = await Match.find({
          $or: [
            { player1: user._id },
            { player2: user._id },
          ],
          status: 'completed',
        })
          .populate('winner', '_id')
          .lean();

        const totalMatches = completedMatches.length;
        const wonMatches = completedMatches.filter(
          match => match.winner?._id.toString() === (user._id as any).toString()
        ).length;
        
        const winRate = totalMatches > 0 ? (wonMatches / totalMatches) * 100 : 0;

        return {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          balance: user.balance,
          totalMatches,
          wonMatches,
          winRate: parseFloat(winRate.toFixed(1)),
        };
      })
    );

    // Sort by win rate (descending), then by total matches (descending), then by balance (descending)
    const sortedLeaderboard = leaderboardData
      .filter(user => user.totalMatches > 0) // Only include users who have played at least one match
      .sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.wonMatches !== a.wonMatches) return b.wonMatches - a.wonMatches;
        return b.balance - a.balance;
      })
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

    // Also include users with no matches at the end
    const usersWithNoMatches = leaderboardData
      .filter(user => user.totalMatches === 0)
      .sort((a, b) => b.balance - a.balance)
      .map((user, index) => ({
        ...user,
        rank: sortedLeaderboard.length + index + 1,
      }));

    const fullLeaderboard = [...sortedLeaderboard, ...usersWithNoMatches];

    return NextResponse.json({
      leaderboard: fullLeaderboard,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
