import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import DisputeTracker from '@/models/DisputeTracker';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status') || 'all';
    const severity = searchParams.get('severity') || 'all';
    const type = searchParams.get('type') || 'all';
    const riskThreshold = parseInt(searchParams.get('riskThreshold') || '0');

    // Build query
    const query: any = {};
    if (status !== 'all') query.status = status;
    if (severity !== 'all') query.severity = severity;
    if (type !== 'all') query.type = type;
    if (riskThreshold > 0) query.riskScore = { $gte: riskThreshold };

    // Get disputes with user details
    const disputes = await DisputeTracker.find(query)
      .populate('userId', 'name phone balance flagged')
      .populate('resolvedBy', 'name phone')
      .populate('matchId', 'roomCode entryFee status')
      .sort({ riskScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await DisputeTracker.countDocuments(query);

    // Get risk statistics
    const riskStats = await DisputeTracker.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageRiskScore: { $avg: '$riskScore' },
          highRiskCount: { $sum: { $cond: [{ $gte: ['$riskScore', 70] }, 1, 0] } },
          autoFlaggedCount: { $sum: { $cond: ['$autoFlagged', 1, 0] } },
          totalDisputes: { $sum: 1 }
        }
      }
    ]);

    // Get top problematic users
    const problemUsers = await DisputeTracker.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: '$userId',
          disputeCount: { $sum: 1 },
          averageRiskScore: { $avg: '$riskScore' },
          lastDispute: { $max: '$createdAt' },
          types: { $addToSet: '$type' }
        }
      },
      { $match: { disputeCount: { $gte: 3 } } },
      { $sort: { disputeCount: -1, averageRiskScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);

    return NextResponse.json({
      disputes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1
      },
      statistics: riskStats[0] || {
        averageRiskScore: 0,
        highRiskCount: 0,
        autoFlaggedCount: 0,
        totalDisputes: 0
      },
      problemUsers
    });

  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminUser = await requireAdminAuth(request);

    const { disputeId, action, adminNotes, actionTaken } = await request.json();

    if (!disputeId || !action) {
      return NextResponse.json(
        { error: 'Dispute ID and action are required' },
        { status: 400 }
      );
    }

    if (!['resolve', 'dismiss', 'investigate', 'take_action'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the dispute
    const dispute = await DisputeTracker.findById(disputeId);
    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Update dispute based on action
    const updateData: any = {
      adminNotes,
      resolvedBy: adminUser.userId,
      updatedAt: new Date()
    };

    switch (action) {
      case 'resolve':
        updateData.status = 'resolved';
        updateData.resolvedAt = new Date();
        break;
      case 'dismiss':
        updateData.status = 'dismissed';
        updateData.resolvedAt = new Date();
        break;
      case 'investigate':
        updateData.status = 'investigating';
        break;
      case 'take_action':
        if (!actionTaken) {
          return NextResponse.json(
            { error: 'Action taken is required' },
            { status: 400 }
          );
        }
        updateData.actionTaken = actionTaken;
        updateData.status = 'resolved';
        updateData.resolvedAt = new Date();

        // Apply the action to the user if needed
        if (['temporary_ban', 'permanent_ban', 'account_restriction'].includes(actionTaken)) {
          const banData: any = {
            flagged: true,
            flagReason: `Admin action: ${actionTaken} - ${adminNotes}`,
            flaggedAt: new Date()
          };

          if (actionTaken === 'permanent_ban') {
            banData.isBanned = true;
            banData.banReason = adminNotes;
            banData.bannedBy = adminUser.userId;
            banData.bannedAt = new Date();
          }

          await User.findByIdAndUpdate(dispute.userId, banData);
        }
        break;
    }

    // Update the dispute
    const updatedDispute = await DisputeTracker.findByIdAndUpdate(
      disputeId,
      updateData,
      { new: true }
    ).populate('userId', 'name phone balance')
     .populate('resolvedBy', 'name phone');

    return NextResponse.json({
      message: `Dispute ${action}d successfully`,
      dispute: updatedDispute
    });

  } catch (error) {
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
