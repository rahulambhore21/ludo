import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import mongoose from 'mongoose';
import { createWalletUpdateNotification } from '@/lib/notificationUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    const { id: transactionId, action } = await params;
    const { note } = await request.json();

    if (!transactionId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID or action' },
        { status: 400 }
      );
    }

    // Validate that the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if transaction is already processed
    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { error: 'Transaction has already been processed' },
        { status: 400 }
      );
    }

    // Process transaction (without MongoDB sessions for local development)
    if (action === 'approve') {
      // Approve transaction
      if (transaction.type === 'deposit') {
        // Add coins to user balance
        if (transaction.userId) {
          await User.findByIdAndUpdate(
            transaction.userId,
            { $inc: { balance: transaction.amount } }
          );
        }
      } else if (transaction.type === 'withdrawal') {
        // For withdrawals, coins are already deducted when request was made
        // Just update status to approved (money will be sent externally)
      }

      // Update transaction status
      await Transaction.findByIdAndUpdate(
        transactionId,
        {
          status: 'approved',
          description: note || 'Approved by admin',
          updatedAt: new Date(),
        }
      );

      // Send notification to user
      if (transaction.userId) {
        try {
          const notificationType = transaction.type === 'deposit' ? 'deposit_approved' : 'withdrawal_approved';
          await createWalletUpdateNotification(
            transaction.userId.toString(),
            notificationType,
            transaction.amount,
            transactionId
          );
        } catch (notifError) {
          console.error('Failed to send wallet notification:', notifError);
        }
      }

    } else if (action === 'reject') {
      // Reject transaction
      if (transaction.type === 'withdrawal') {
        // Return coins to user balance for rejected withdrawal
        if (transaction.userId) {
          await User.findByIdAndUpdate(
            transaction.userId,
            { $inc: { balance: transaction.amount } }
          );
        }
      }
      // For deposits, no need to do anything as coins weren't added yet

      // Update transaction status
      await Transaction.findByIdAndUpdate(
        transactionId,
        {
          status: 'rejected',
          description: note || 'Rejected by admin',
          updatedAt: new Date(),
        }
      );

      // Send notification to user
      if (transaction.userId) {
        try {
          const notificationType = transaction.type === 'deposit' ? 'deposit_rejected' : 'withdrawal_rejected';
          await createWalletUpdateNotification(
            transaction.userId.toString(),
            notificationType,
            transaction.amount,
            transactionId
          );
        } catch (notifError) {
          console.error('Failed to send wallet notification:', notifError);
        }
      }
    }

    // Get updated transaction
    const updatedTransaction = await Transaction.findById(transactionId)
      .populate('userId', 'name phone')
      .select('-__v')
      .lean();

    return NextResponse.json({
      message: `Transaction ${action}d successfully`,
      transaction: updatedTransaction,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.error('Admin transaction action error:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction' },
      { status: 500 }
    );
  }
}
