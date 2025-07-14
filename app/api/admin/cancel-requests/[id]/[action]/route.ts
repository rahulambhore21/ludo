import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import CancelRequest from '@/models/CancelRequest';
import Match from '@/models/Match';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    // Require admin authentication
    const adminUser = await requireAdminAuth(request);

    const { id: requestId, action } = await params;
    const { note } = await request.json();

    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request ID or action' },
        { status: 400 }
      );
    }

    // Validate that the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return NextResponse.json(
        { error: 'Invalid request ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the cancel request
    const cancelRequest = await CancelRequest.findById(requestId)
      .populate('matchId')
      .populate('requestedBy');

    if (!cancelRequest) {
      return NextResponse.json(
        { error: 'Cancel request not found' },
        { status: 404 }
      );
    }

    if (cancelRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cancel request has already been processed' },
        { status: 400 }
      );
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Update cancel request status
        cancelRequest.status = action === 'approve' ? 'approved' : 'rejected';
        cancelRequest.reviewedBy = adminUser.userId;
        cancelRequest.reviewNote = note || '';
        await cancelRequest.save({ session });

        if (action === 'approve') {
          // If approved, cancel the match and refund entry fees
          const match = await Match.findById(cancelRequest.matchId._id).session(session);
          
          if (match && match.status !== 'completed') {
            // Update match status to cancelled
            match.status = 'cancelled';
            await match.save({ session });

            // Refund entry fees to both players
            if (match.player1) {
              await User.findByIdAndUpdate(
                match.player1,
                { $inc: { balance: match.entryFee } },
                { session }
              );
            }

            if (match.player2) {
              await User.findByIdAndUpdate(
                match.player2,
                { $inc: { balance: match.entryFee } },
                { session }
              );
            }
          }
        }
      });

      return NextResponse.json({
        message: `Cancel request ${action}d successfully`,
        cancelRequest: {
          id: cancelRequest._id,
          status: cancelRequest.status,
          reviewedBy: adminUser.userId,
          reviewNote: cancelRequest.reviewNote,
        },
      });

    } finally {
      await session.endSession();
    }

  } catch (error) {
    const { action } = await params;
    console.error(`Admin ${action} cancel request error:`, error);

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

    return NextResponse.json(
      { error: `Failed to ${action} cancel request` },
      { status: 500 }
    );
  }
}
