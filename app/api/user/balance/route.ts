import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authUser = requireAuth(request);

    // Connect to database
    await dbConnect();

    // Get fresh user data
    const user = await User.findById(authUser.userId).select('-__v');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        balance: user.balance,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get user balance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
