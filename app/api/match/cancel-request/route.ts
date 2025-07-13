import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import CancelRequest from '@/models/CancelRequest';
import Match from '@/models/Match';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authUser = requireAuth(request);

    // Parse FormData
    const formData = await request.formData();
    const matchId = formData.get('matchId') as string;
    const reason = formData.get('reason') as string;
    const screenshotFile = formData.get('screenshot') as File;

    if (!matchId || !reason || !screenshotFile) {
      return NextResponse.json(
        { error: 'Match ID, reason, and screenshot are required' },
        { status: 400 }
      );
    }

    // Validate screenshot file
    if (!screenshotFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Screenshot must be an image file' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (screenshotFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Screenshot size should be less than 5MB' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Check if match exists and user is a participant
    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant in this match
    const isPlayer1 = match.player1.toString() === authUser.userId;
    const isPlayer2 = match.player2?.toString() === authUser.userId;
    
    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json(
        { error: 'You are not a participant in this match' },
        { status: 403 }
      );
    }

    // Check if match can be cancelled
    if (match.status === 'completed' || match.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed or already cancelled match' },
        { status: 400 }
      );
    }

    // Check if there's already a pending cancel request for this match
    const existingRequest = await CancelRequest.findOne({
      matchId,
      status: 'pending'
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'There is already a pending cancel request for this match' },
        { status: 400 }
      );
    }

    // Upload screenshot to Cloudinary
    let screenshotUrl = '';
    try {
      const bytes = await screenshotFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `cancel-request-${matchId}-${Date.now()}`;
      screenshotUrl = await uploadToCloudinary(buffer, fileName);
    } catch (uploadError) {
      console.error('Screenshot upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload screenshot' },
        { status: 500 }
      );
    }

    // Create cancel request
    const cancelRequest = new CancelRequest({
      matchId,
      requestedBy: authUser.userId,
      reason,
      screenshotUrl,
      status: 'pending',
    });

    await cancelRequest.save();

    return NextResponse.json({
      message: 'Cancel request submitted successfully',
      requestId: cancelRequest._id,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Submit cancel request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit cancel request' },
      { status: 500 }
    );
  }
}
