import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import BanAction from '@/models/BanAction';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminUser = await requireAdminAuth(request);

    const { userId, action, reason } = await request.json();

    if (!userId || !action || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['ban', 'unban'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (user.isAdmin) {
      return NextResponse.json(
        { error: 'Cannot ban admin users' },
        { status: 400 }
      );
    }

    // Update user ban status
    if (action === 'ban') {
      if (user.isBanned) {
        return NextResponse.json(
          { error: 'User is already banned' },
          { status: 400 }
        );
      }

      await User.findByIdAndUpdate(userId, {
        isBanned: true,
        banReason: reason,
        bannedBy: adminUser.userId,
        bannedAt: new Date()
      });
    } else {
      if (!user.isBanned) {
        return NextResponse.json(
          { error: 'User is not banned' },
          { status: 400 }
        );
      }

      await User.findByIdAndUpdate(userId, {
        isBanned: false,
        banReason: null,
        bannedBy: null,
        bannedAt: null
      });
    }

    // Create ban action record
    await BanAction.create({
      userId,
      adminId: adminUser.userId,
      action,
      reason
    });

    return NextResponse.json({
      message: `User ${action === 'ban' ? 'banned' : 'unbanned'} successfully`
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('Ban user error:', error);
    return NextResponse.json(
      { error: 'Failed to perform ban action' },
      { status: 500 }
    );
  }
}
