import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Admin Action Log Schema (reuse from override-match)
const AdminActionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

const AdminAction = mongoose.models.AdminAction || mongoose.model('AdminAction', AdminActionSchema);

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const dateFilter = searchParams.get('dateFilter') || 'today';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (action && action !== 'all') {
      query.action = action;
    }

    // Date filtering
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.timestamp = { $gte: startOfToday };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query.timestamp = { $gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query.timestamp = { $gte: monthAgo };
        break;
      // 'all' - no date filter
    }

    // Get admin actions
    const actions = await AdminAction.find(query)
      .populate('adminId', 'name phone')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AdminAction.countDocuments(query);

    return NextResponse.json({
      actions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('Get admin action logs error:', error);
    return NextResponse.json(
      { error: 'Failed to get admin action logs' },
      { status: 500 }
    );
  }
}

// Helper function to log admin actions (can be used by other endpoints)
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: any = {}
) {
  try {
    await dbConnect();
    
    await AdminAction.create({
      adminId,
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date(),
    });
    
    console.log(`Admin action logged: ${action} by ${adminId} on ${targetType}:${targetId}`);
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}
