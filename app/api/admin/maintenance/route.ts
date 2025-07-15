import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Connect to database
    await dbConnect();

    // Get maintenance settings
    let settings = await SystemSettings.findOne({ type: 'maintenance' });
    
    if (!settings) {
      // Create default settings if they don't exist
      settings = await SystemSettings.create({
        type: 'maintenance',
        settings: {
          isMaintenanceMode: false,
          maintenanceMessage: 'System is under maintenance. Please try again later.',
        }
      });
    }

    return NextResponse.json({
      settings: settings.settings,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('Get maintenance settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get maintenance settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminUser = await requireAdminAuth(request);

    const { isMaintenanceMode, maintenanceMessage, estimatedEndTime } = await request.json();

    if (typeof isMaintenanceMode !== 'boolean' || !maintenanceMessage) {
      return NextResponse.json(
        { error: 'Invalid maintenance settings' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get admin user details for logging
    const User = (await import('@/models/User')).default;
    const admin = await User.findById(adminUser.userId);

    // Update or create maintenance settings
    const settings = await SystemSettings.findOneAndUpdate(
      { type: 'maintenance' },
      {
        type: 'maintenance',
        settings: {
          isMaintenanceMode,
          maintenanceMessage,
          estimatedEndTime: estimatedEndTime || null,
          lastUpdatedBy: admin?.name || 'Unknown Admin',
          updatedAt: new Date(),
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: 'Maintenance settings updated successfully',
      settings: settings.settings,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('Update maintenance settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance settings' },
      { status: 500 }
    );
  }
}
