import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Use the same Alert model
const AlertSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['error', 'warning', 'info'], 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['system', 'bet', 'match', 'user', 'payment'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  details: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: Date,
});

const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminData = await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    const { alertId } = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Find and update the alert
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        acknowledged: true,
        acknowledgedBy: adminData.userId,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alert acknowledged successfully',
      alert
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('Acknowledge alert error:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}
