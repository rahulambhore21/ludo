import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function checkBannedUser(request: NextRequest): Promise<void> {
  try {
    // Get user from auth
    const authUser = requireAuth(request);
    
    // Connect to database
    await dbConnect();
    
    // Check if user is banned
    const user = await User.findById(authUser.userId);
    
    if (user && user.isBanned) {
      throw new Error(`Your account has been banned. Reason: ${user.banReason || 'Violation of platform policies'}`);
    }
    
  } catch (error) {
    throw error;
  }
}
