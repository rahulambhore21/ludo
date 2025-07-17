import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import WalletAudit from '@/models/WalletAudit';
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
    const userId = searchParams.get('userId');
    const flagged = searchParams.get('flagged');
    const type = searchParams.get('type') || 'all';
    const verificationStatus = searchParams.get('verificationStatus') || 'all';
    const amountThreshold = parseInt(searchParams.get('amountThreshold') || '0');

    // Build query
    const query: any = {};
    if (userId) query.userId = new mongoose.Types.ObjectId(userId);
    if (flagged === 'true') query.flagged = true;
    if (flagged === 'false') query.flagged = false;
    if (type !== 'all') query.type = type;
    if (verificationStatus !== 'all') query.verificationStatus = verificationStatus;
    if (amountThreshold > 0) query.amount = { $gte: amountThreshold };

    // Get audits with user details
    const audits = await WalletAudit.find(query)
      .populate('userId', 'name phone balance')
      .populate('adminId', 'name phone')
      .populate('transactionId', 'type amount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await WalletAudit.countDocuments(query);

    // Get security statistics
    const securityStats = await WalletAudit.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAudits: { $sum: 1 },
          flaggedCount: { $sum: { $cond: ['$flagged', 1, 0] } },
          suspiciousCount: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'suspicious'] }, 1, 0] } },
          blockedCount: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'blocked'] }, 1, 0] } },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Get suspicious activity trends (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trends = await WalletAudit.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, flagged: true } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get top flagged users
    const flaggedUsers = await WalletAudit.aggregate([
      { $match: { flagged: true, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: '$userId',
          flaggedCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          lastActivity: { $max: '$createdAt' }
        }
      },
      { $sort: { flaggedCount: -1 } },
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
      audits,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1
      },
      statistics: securityStats[0] || {
        totalAudits: 0,
        flaggedCount: 0,
        suspiciousCount: 0,
        blockedCount: 0,
        totalAmount: 0,
        averageAmount: 0
      },
      trends,
      flaggedUsers
    });

  } catch (error) {
    console.error('Error fetching wallet audits:', error);
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

    const { auditId, action, notes } = await request.json();

    if (!auditId || !action) {
      return NextResponse.json(
        { error: 'Audit ID and action are required' },
        { status: 400 }
      );
    }

    if (!['verify', 'mark_suspicious', 'block', 'clear_flag'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the audit
    const audit = await WalletAudit.findById(auditId);
    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    // Update audit based on action
    const updateData: any = {
      updatedAt: new Date()
    };

    switch (action) {
      case 'verify':
        updateData.verificationStatus = 'verified';
        updateData.flagged = false;
        updateData.flagReason = null;
        break;
      case 'mark_suspicious':
        updateData.verificationStatus = 'suspicious';
        updateData.flagged = true;
        updateData.flagReason = notes || 'Marked as suspicious by admin';
        break;
      case 'block':
        updateData.verificationStatus = 'blocked';
        updateData.flagged = true;
        updateData.flagReason = notes || 'Blocked by admin';
        break;
      case 'clear_flag':
        updateData.flagged = false;
        updateData.flagReason = null;
        updateData.verificationStatus = 'verified';
        break;
    }

    // Update the audit
    const updatedAudit = await WalletAudit.findByIdAndUpdate(
      auditId,
      updateData,
      { new: true }
    ).populate('userId', 'name phone balance');

    return NextResponse.json({
      message: `Audit ${action} completed successfully`,
      audit: updatedAudit
    });

  } catch (error) {
    console.error('Error updating wallet audit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
