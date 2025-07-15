import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    // Get total user count
    const totalUsers = await User.countDocuments();
    console.log('Total users in DB:', totalUsers);

    // Get a sample of users
    const sampleUsers = await User.find().limit(5).select('name phone isAdmin isBanned').lean();
    console.log('Sample users:', sampleUsers);

    // Get admin users count
    const adminCount = await User.countDocuments({ isAdmin: true });
    
    // Get banned users count
    const bannedCount = await User.countDocuments({ isBanned: true });

    return NextResponse.json({
      totalUsers,
      adminCount,
      bannedCount,
      sampleUsers,
      debug: 'User debug info'
    });

  } catch (error) {
    console.error('Debug users error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to debug users', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
