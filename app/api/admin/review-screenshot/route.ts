import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Use the same Screenshot model from the other file
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

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminData = await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    const { screenshotId, action, reason } = await request.json();

    if (!screenshotId || !action) {
      return NextResponse.json(
        { error: 'Screenshot ID and action are required' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Find the screenshot
    const screenshot = await Screenshot.findById(screenshotId);
    if (!screenshot) {
      return NextResponse.json(
        { error: 'Screenshot not found' },
        { status: 404 }
      );
    }

    // Update screenshot status
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedAt: new Date(),
      reviewedBy: adminData.userId,
    };

    if (action === 'reject' && reason) {
      updateData.rejectReason = reason;
    }

    await Screenshot.findByIdAndUpdate(screenshotId, updateData);

    // Log admin action
    console.log(`Admin ${adminData.userId} ${action}ed screenshot ${screenshotId}${reason ? ` with reason: ${reason}` : ''}`);

    return NextResponse.json({
      success: true,
      message: `Screenshot ${action}ed successfully`
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('Review screenshot error:', error);
    return NextResponse.json(
      { error: 'Failed to review screenshot' },
      { status: 500 }
    );
  }
}
