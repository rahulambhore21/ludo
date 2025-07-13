import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authUser = requireAuth(request);

    // Connect to database
    await dbConnect();

    // Get user's notifications (latest 20)
    const notifications = await Notification.find({ userId: authUser.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-__v')
      .lean();

    // Get unread count
    const unreadCount = await Notification.countDocuments({ 
      userId: authUser.userId, 
      read: false 
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    const authUser = requireAuth(request);

    const { notificationIds } = await request.json();

    // Connect to database
    await dbConnect();

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await Notification.updateMany(
        { 
          _id: { $in: notificationIds },
          userId: authUser.userId 
        },
        { read: true }
      );
    } else {
      // Mark all notifications as read
      await Notification.updateMany(
        { userId: authUser.userId },
        { read: true }
      );
    }

    return NextResponse.json({
      message: 'Notifications marked as read',
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Mark notifications read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
