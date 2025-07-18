import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import { AdminAction } from '@/lib/adminActionLogger';

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
