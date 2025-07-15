import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Screenshot schema
const ScreenshotSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, required: true },
  playerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  playerName: { type: String, required: true },
  imageUrl: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  uploadedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId },
  rejectReason: String,
  matchAmount: Number,
});

const Screenshot = mongoose.models.Screenshot || mongoose.model('Screenshot', ScreenshotSchema);

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get screenshots
    const screenshots = await Screenshot.find(query)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewedBy', 'name')
      .lean();

    const total = await Screenshot.countDocuments(query);

    return NextResponse.json({
      screenshots,
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

    console.error('Get screenshots error:', error);
    return NextResponse.json(
      { error: 'Failed to get screenshots' },
      { status: 500 }
    );
  }
}
