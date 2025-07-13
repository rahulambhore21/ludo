import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import CancelRequest from '@/models/CancelRequest';
import Match from '@/models/Match';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
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
        { error: 'Valid request ID and action (approve/reject) are required' },
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
    const cancelRequest = await CancelRequest.findById(requestId).populate('matchId');
    if (!cancelRequest) {
      return NextResponse.json(
        { error: 'Cancel request not found' },
        { status: 404 }
      );
    }

    // Check if already reviewed
    if (cancelRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This cancel request has already been reviewed' },
        { status: 400 }
      );
    }

    const match = cancelRequest.matchId;
    if (!match) {
      return NextResponse.json(
        { error: 'Associated match not found' },
        { status: 404 }
      );
    }

    // Update cancel request status
    cancelRequest.status = action === 'approve' ? 'approved' : 'rejected';
    cancelRequest.reviewedBy = adminUser.userId;
    cancelRequest.reviewNote = note || '';
    await cancelRequest.save();

    // If approved, process the cancellation
    if (action === 'approve') {
      // Update match status to cancelled
      await Match.findByIdAndUpdate(match._id, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: adminUser.userId,
        cancelReason: cancelRequest.reason,
      });

      // Refund entry fees to both players if match was active
      if (match.status === 'active' && match.player1 && match.player2) {
        // Refund to player 1
        await User.findByIdAndUpdate(match.player1, {
          $inc: { balance: match.entryFee }
        });

        // Refund to player 2
        await User.findByIdAndUpdate(match.player2, {
          $inc: { balance: match.entryFee }
        });

        // Create refund transaction records
        const refundTransactions = [
          {
            userId: match.player1,
            type: 'refund',
            amount: match.entryFee,
            status: 'approved',
            description: `Refund for cancelled match #${match._id.toString().slice(-6)}`,
            approvedBy: adminUser.userId,
          },
          {
            userId: match.player2,
            type: 'refund',
            amount: match.entryFee,
            status: 'approved',
            description: `Refund for cancelled match #${match._id.toString().slice(-6)}`,
            approvedBy: adminUser.userId,
          }
        ];

        await Transaction.insertMany(refundTransactions);
      } else if (match.status === 'waiting' && match.player1) {
        // If only one player joined, refund to that player
        await User.findByIdAndUpdate(match.player1, {
          $inc: { balance: match.entryFee }
        });

        await Transaction.create({
          userId: match.player1,
          type: 'refund',
          amount: match.entryFee,
          status: 'approved',
          description: `Refund for cancelled match #${match._id.toString().slice(-6)}`,
          approvedBy: adminUser.userId,
        });
      }
    }

    return NextResponse.json({
      message: `Cancel request ${action}d successfully`,
      cancelRequest: {
        _id: cancelRequest._id,
        status: cancelRequest.status,
        reviewedBy: adminUser.userId,
        reviewNote: cancelRequest.reviewNote,
      },
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

    console.error('Admin review cancel request error:', error);
    return NextResponse.json(
      { error: 'Failed to review cancel request' },
      { status: 500 }
    );
  }
}
