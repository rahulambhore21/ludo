import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import CancelRequest from '@/models/CancelRequest';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    // Get all cancel requests with match and user details
    const cancelRequests = await CancelRequest.find()
      .populate('matchId', 'entryFee pot roomCode status createdAt')
      .populate('requestedBy', 'name phone')
      .populate('reviewedBy', 'name phone')
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    return NextResponse.json({
      cancelRequests,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.error('Admin get cancel requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancel requests' },
      { status: 500 }
    );
  }
}
