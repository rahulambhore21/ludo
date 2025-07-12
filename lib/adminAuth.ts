import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { JWTPayload } from '@/lib/jwt';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function requireAdminAuth(request: NextRequest): Promise<JWTPayload> {
  // First check if user is authenticated
  const authUser = requireAuth(request);
  
  // Connect to database to check admin status
  await dbConnect();
  
  // Get user from database to verify admin status
  const user = await User.findById(authUser.userId);
  
  if (!user || !user.isAdmin) {
    throw new Error('Admin access required');
  }
  
  return authUser;
}
