import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Alert Schema
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

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'unacknowledged';
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (filter === 'acknowledged') {
      query.acknowledged = true;
    } else if (filter === 'unacknowledged') {
      query.acknowledged = false;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    // Get alerts
    const alerts = await Alert.find(query)
      .populate('acknowledgedBy', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Alert.countDocuments(query);

    return NextResponse.json({
      alerts,
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

    console.error('Get monitoring alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to get monitoring alerts' },
      { status: 500 }
    );
  }
}

// Helper function to create alerts (can be used by other parts of the system)
export async function createAlert(
  type: 'error' | 'warning' | 'info',
  category: 'system' | 'bet' | 'match' | 'user' | 'payment',
  title: string,
  message: string,
  details: any = {}
) {
  try {
    await dbConnect();
    
    const alert = new Alert({
      type,
      category,
      title,
      message,
      details,
      createdAt: new Date(),
    });
    
    await alert.save();
    console.log(`Alert created: ${type.toUpperCase()} - ${title}`);
    
    return alert;
  } catch (error) {
    console.error('Failed to create alert:', error);
    return null;
  }
}
