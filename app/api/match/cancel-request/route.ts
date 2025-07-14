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

    // Validate reason
    const validReasons = [
      'opponent_not_responding',
      'technical_issues', 
      'game_crashed',
      'unfair_play',
      'personal_emergency',
      'other'
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid cancellation reason' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Verify match exists and user is a participant
    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if user is participant in the match
    const isParticipant = 
      match.player1.toString() === authUser.userId || 
      match.player2?.toString() === authUser.userId;

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this match' },
        { status: 403 }
      );
    }

    // Check if match can be cancelled (not completed)
    if (match.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed match' },
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
        { error: 'A cancel request is already pending for this match' },
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
        { error: 'Failed to upload screenshot. Please try again.' },
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

    // TODO: Send notification to admins about new cancel request
    // You can implement this using your notification system

    return NextResponse.json({
      message: 'Cancel request submitted successfully',
      requestId: cancelRequest._id,
    }, { status: 201 });

  } catch (error) {
    console.error('Cancel request error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit cancel request' },
      { status: 500 }
    );
  }
}
