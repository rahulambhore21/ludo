import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // Get maintenance settings
    const settings = await SystemSettings.findOne({ type: 'maintenance' });
    
    const isMaintenanceMode = settings?.settings?.isMaintenanceMode || false;
    
    return NextResponse.json({
      isMaintenanceMode,
      maintenanceMessage: settings?.settings?.maintenanceMessage || 'System is under maintenance. Please try again later.',
      estimatedEndTime: settings?.settings?.estimatedEndTime || null,
    });

  } catch (error) {
    console.error('Check maintenance status error:', error);
    return NextResponse.json(
      { 
        isMaintenanceMode: false,
        maintenanceMessage: 'System is under maintenance. Please try again later.',
        estimatedEndTime: null
      },
      { status: 200 }
    );
  }
}
