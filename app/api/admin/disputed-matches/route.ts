import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Match schema (assuming it exists)
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

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Get disputed or problematic matches
    const matches = await Match.find({
      $or: [
        { status: 'disputed' },
        { status: 'pending' },
        { status: 'active', updatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Old active matches
      ]
    })
      .populate('player1', 'name phone')
      .populate('player2', 'name phone')
      .populate('winner', 'name phone')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Match.countDocuments({
      $or: [
        { status: 'disputed' },
        { status: 'pending' },
        { status: 'active', updatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    });

    return NextResponse.json({
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('Get disputed matches error:', error);
    return NextResponse.json(
      { error: 'Failed to get disputed matches' },
      { status: 500 }
    );
  }
}
