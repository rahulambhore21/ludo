import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (status !== 'all') {
      filter.status = status;
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'player1',
          foreignField: '_id',
          as: 'player1',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'player2',
          foreignField: '_id',
          as: 'player2',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'winner',
          foreignField: '_id',
          as: 'winner',
        },
      },
      {
        $unwind: '$player1',
      },
      {
        $unwind: {
          path: '$player2',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$winner',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          'player1.name': 1,
          'player1.phone': 1,
          'player2.name': 1,
          'player2.phone': 1,
          'winner.name': 1,
          'winner.phone': 1,
          entryFee: 1,
          pot: 1,
          platformCut: 1,
          roomCode: 1,
          player1Result: 1,
          player2Result: 1,
          player1Screenshot: 1,
          player2Screenshot: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          completedAt: 1,
        },
      },
    ];

    // Add search filter if provided
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'player1.name': { $regex: search, $options: 'i' } },
            { 'player1.phone': { $regex: search, $options: 'i' } },
            { 'player2.name': { $regex: search, $options: 'i' } },
            { 'player2.phone': { $regex: search, $options: 'i' } },
            { roomCode: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    // Add status filter
    if (status !== 'all') {
      pipeline.push({
        $match: { status },
      });
    }

    // Add sorting
    pipeline.push({
      $sort: { createdAt: -1 },
    });

    // Get total count
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Match.aggregate(totalPipeline);
    const totalMatches = totalResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Execute aggregation
    const matches = await Match.aggregate(pipeline);

    // Get statistics
    const stats = await Match.aggregate([
      {
        $group: {
          _id: null,
          totalMatches: { $sum: 1 },
          totalRevenue: { $sum: '$platformCut' },
          completedMatches: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          conflictMatches: {
            $sum: { $cond: [{ $eq: ['$status', 'conflict'] }, 1, 0] },
          },
          activeMatches: {
            $sum: { $cond: [{ $in: ['$status', ['active', 'in-progress']] }, 1, 0] },
          },
          waitingMatches: {
            $sum: { $cond: [{ $eq: ['$status', 'waiting'] }, 1, 0] },
          },
          cancelledMatches: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
    ]);

    return NextResponse.json({
      matches,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMatches / limit),
        totalMatches,
        limit,
      },
      stats: stats[0] || {
        totalMatches: 0,
        totalRevenue: 0,
        completedMatches: 0,
        conflictMatches: 0,
        activeMatches: 0,
        waitingMatches: 0,
        cancelledMatches: 0,
      },
    });

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

    console.error('Admin get matches error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
