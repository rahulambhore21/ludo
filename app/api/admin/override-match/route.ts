import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';

// Use the same Match model
const MatchSchema = new mongoose.Schema({
  player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'active', 'completed', 'disputed', 'cancelled', 'abandoned'],
    default: 'waiting'
  },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  result: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  disputeReason: String,
  overrideReason: String,
  overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  overriddenAt: Date,
});

const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);

// Admin Action Log Schema
const AdminActionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true }, // 'match', 'user', 'wallet', etc.
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

const AdminAction = mongoose.models.AdminAction || mongoose.model('AdminAction', AdminActionSchema);

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminData = await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    const { matchId, winnerId, reason } = await request.json();

    if (!matchId || !winnerId || !reason) {
      return NextResponse.json(
        { error: 'Match ID, winner ID, and reason are required' },
        { status: 400 }
      );
    }

    // Find the match
    const match = await Match.findById(matchId).populate('player1 player2');
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let newStatus = 'completed';
      let winnerUser = null;
      let loserUser = null;

      if (winnerId === 'draw') {
        // Handle draw - refund both players
        if (match.player1) {
          await User.findByIdAndUpdate(
            match.player1._id,
            { $inc: { balance: match.amount } },
            { session }
          );
        }
        if (match.player2) {
          await User.findByIdAndUpdate(
            match.player2._id,
            { $inc: { balance: match.amount } },
            { session }
          );
        }
        newStatus = 'cancelled';
      } else {
        // Handle win/loss
        winnerUser = await User.findById(winnerId);
        if (!winnerUser) {
          throw new Error('Winner not found');
        }

        // Determine loser
        if (match.player1._id.toString() === winnerId) {
          loserUser = match.player2;
        } else if (match.player2 && match.player2._id.toString() === winnerId) {
          loserUser = match.player1;
        } else {
          throw new Error('Winner must be one of the match players');
        }

        // Award winner (winner gets double the amount - their stake back + opponent's stake)
        await User.findByIdAndUpdate(
          winnerId,
          { $inc: { balance: match.amount * 2 } },
          { session }
        );
      }

      // Update match
      const updateData: any = {
        status: newStatus,
        winner: winnerId === 'draw' ? null : winnerId,
        result: winnerId === 'draw' ? 'draw' : 'manual_override',
        overrideReason: reason,
        overriddenBy: adminData.userId,
        overriddenAt: new Date(),
        updatedAt: new Date(),
      };

      await Match.findByIdAndUpdate(matchId, updateData, { session });

      // Log admin action
      await AdminAction.create([{
        adminId: adminData.userId,
        action: 'match_override',
        targetType: 'match',
        targetId: matchId,
        details: {
          originalStatus: match.status,
          newStatus,
          winnerId: winnerId === 'draw' ? null : winnerId,
          reason,
          amount: match.amount,
          player1: match.player1?._id,
          player2: match.player2?._id,
        }
      }], { session });

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: `Match ${winnerId === 'draw' ? 'marked as draw' : 'result overridden'} successfully`
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('Override match error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to override match',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
