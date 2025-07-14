import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Match from '@/models/Match';
import Transaction from '@/models/Transaction';
import CancelRequest from '@/models/CancelRequest';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    // Get current date for today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this week's start (Monday)
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay() + 1);

    // Get this month's start
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Fetch all statistics in parallel
    const [
      // User statistics
      totalUsers,
      totalCoinsInSystem,
      newUsersToday,
      newUsersThisWeek,
      
      // Match statistics
      matchStats,
      totalPlatformEarnings,
      earningsToday,
      earningsThisWeek,
      earningsThisMonth,
      
      // Transaction statistics
      transactionStats,
      pendingDeposits,
      pendingWithdrawals,
      
      // Cancel request statistics
      cancelRequestStats,
      
      // Recent activity
      recentMatches,
      recentTransactions,
    ] = await Promise.all([
      // User queries
      User.countDocuments(),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
      User.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      User.countDocuments({ createdAt: { $gte: thisWeekStart } }),
      
      // Match queries
      Match.aggregate([
        {
          $group: {
            _id: null,
            totalMatches: { $sum: 1 },
            completedMatches: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            activeMatches: { $sum: { $cond: [{ $in: ['$status', ['active', 'in-progress']] }, 1, 0] } },
            waitingMatches: { $sum: { $cond: [{ $eq: ['$status', 'waiting'] }, 1, 0] } },
            conflictMatches: { $sum: { $cond: [{ $eq: ['$status', 'conflict'] }, 1, 0] } },
            cancelledMatches: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            totalPot: { $sum: '$pot' },
          },
        },
      ]),
      Match.aggregate([{ $group: { _id: null, total: { $sum: '$platformCut' } } }]),
      Match.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$platformCut' } } },
      ]),
      Match.aggregate([
        { $match: { createdAt: { $gte: thisWeekStart }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$platformCut' } } },
      ]),
      Match.aggregate([
        { $match: { createdAt: { $gte: thisMonthStart }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$platformCut' } } },
      ]),
      
      // Transaction queries
      Transaction.aggregate([
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            totalVolume: { $sum: '$amount' },
            depositsToday: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$type', 'deposit'] },
                      { $gte: ['$createdAt', today] },
                      { $lt: ['$createdAt', tomorrow] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            withdrawalsToday: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$type', 'withdrawal'] },
                      { $gte: ['$createdAt', today] },
                      { $lt: ['$createdAt', tomorrow] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Transaction.countDocuments({ type: 'deposit', status: 'pending' }),
      Transaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
      
      // Cancel request queries
      CancelRequest.aggregate([
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            pendingRequests: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            approvedRequests: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            rejectedRequests: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          },
        },
      ]),
      
      // Recent activity
      Match.find()
        .populate('player1', 'name phone')
        .populate('player2', 'name phone')
        .populate('winner', 'name phone')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Transaction.find({ userId: { $exists: true } })
        .populate('userId', 'name phone')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Process the results
    const stats = {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        totalCoinsInSystem: totalCoinsInSystem[0]?.total || 0,
      },
      matches: {
        total: matchStats[0]?.totalMatches || 0,
        completed: matchStats[0]?.completedMatches || 0,
        active: matchStats[0]?.activeMatches || 0,
        waiting: matchStats[0]?.waitingMatches || 0,
        conflicts: matchStats[0]?.conflictMatches || 0,
        cancelled: matchStats[0]?.cancelledMatches || 0,
        totalPot: matchStats[0]?.totalPot || 0,
      },
      earnings: {
        total: totalPlatformEarnings[0]?.total || 0,
        today: earningsToday[0]?.total || 0,
        thisWeek: earningsThisWeek[0]?.total || 0,
        thisMonth: earningsThisMonth[0]?.total || 0,
      },
      transactions: {
        total: transactionStats[0]?.totalTransactions || 0,
        pending: transactionStats[0]?.pendingCount || 0,
        approved: transactionStats[0]?.approvedCount || 0,
        rejected: transactionStats[0]?.rejectedCount || 0,
        totalVolume: transactionStats[0]?.totalVolume || 0,
        depositsToday: transactionStats[0]?.depositsToday || 0,
        withdrawalsToday: transactionStats[0]?.withdrawalsToday || 0,
        pendingDeposits,
        pendingWithdrawals,
      },
      cancelRequests: {
        total: cancelRequestStats[0]?.totalRequests || 0,
        pending: cancelRequestStats[0]?.pendingRequests || 0,
        approved: cancelRequestStats[0]?.approvedRequests || 0,
        rejected: cancelRequestStats[0]?.rejectedRequests || 0,
      },
      recentActivity: {
        matches: recentMatches,
        transactions: recentTransactions,
      },
    };

    return NextResponse.json({ stats });

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

    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
