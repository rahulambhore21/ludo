import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';
import { secureBalanceUpdate } from '@/lib/securityUtils';

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

    // Get admin user info
    const adminUser = await requireAdminAuth(request);

    // Process transaction (without MongoDB sessions for local development)
    if (action === 'approve') {
      // Approve transaction
      if (transaction.type === 'deposit') {
        // Add coins to user balance with security audit
        if (transaction.userId) {
          await secureBalanceUpdate({
            userId: transaction.userId.toString(),
            amount: transaction.amount,
            type: 'balance_change',
            reason: `Deposit approved: ${note || 'Admin approved deposit'}`,
            adminId: adminUser.userId,
            transactionId: transactionId,
            request,
            metadata: {
              transactionType: 'deposit_approval',
              originalAmount: transaction.amount,
              proofUrl: transaction.proofUrl
            }
          });
        }
      } else if (transaction.type === 'withdrawal') {
        // For withdrawals, coins are already deducted when request was made
        // Just update status to approved (money will be sent externally)
        // Create audit for tracking
        if (transaction.userId) {
          const user = await User.findById(transaction.userId);
          if (user) {
            await secureBalanceUpdate({
              userId: transaction.userId.toString(),
              amount: 0, // No balance change, just audit
              type: 'balance_change',
              reason: `Withdrawal approved: ${note || 'Admin approved withdrawal'}`,
              adminId: adminUser.userId,
              transactionId: transactionId,
              request,
              metadata: {
                transactionType: 'withdrawal_approval',
                withdrawalAmount: transaction.amount,
                upiId: transaction.upiId
              }
            });
          }
        }
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
        const notification = new Notification({
          userId: transaction.userId,
          type: 'wallet',
          title: transaction.type === 'deposit' ? 'Deposit Approved!' : 'Withdrawal Approved!',
          message: transaction.type === 'deposit' 
            ? `Your deposit of ₹${transaction.amount} has been approved and added to your wallet.`
            : `Your withdrawal request of ₹${transaction.amount} has been approved and will be processed shortly.`,
          data: {
            type: transaction.type === 'deposit' ? 'deposit_approved' : 'withdrawal_approved',
            amount: transaction.amount,
            transactionId: transactionId,
            note: note
          },
          read: false,
          createdAt: new Date()
        });
        await notification.save();
      }

    } else if (action === 'reject') {
      // Reject transaction
      if (transaction.type === 'withdrawal') {
        // Return coins to user balance for rejected withdrawal with security audit
        if (transaction.userId) {
          await secureBalanceUpdate({
            userId: transaction.userId.toString(),
            amount: transaction.amount,
            type: 'refund',
            reason: `Withdrawal rejected: ${note || 'Admin rejected withdrawal'}`,
            adminId: adminUser.userId,
            transactionId: transactionId,
            request,
            metadata: {
              transactionType: 'withdrawal_rejection',
              refundAmount: transaction.amount,
              upiId: transaction.upiId
            }
          });
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
        const notification = new Notification({
          userId: transaction.userId,
          type: 'wallet',
          title: transaction.type === 'deposit' ? 'Deposit Rejected' : 'Withdrawal Rejected',
          message: transaction.type === 'deposit' 
            ? `Your deposit request of ₹${transaction.amount} has been rejected. Reason: ${note || 'No reason provided'}`
            : `Your withdrawal request of ₹${transaction.amount} has been rejected and the amount has been refunded to your wallet. Reason: ${note || 'No reason provided'}`,
          data: {
            type: transaction.type === 'deposit' ? 'deposit_rejected' : 'withdrawal_rejected',
            amount: transaction.amount,
            transactionId: transactionId,
            note: note
          },
          read: false,
          createdAt: new Date()
        });
        await notification.save();
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
