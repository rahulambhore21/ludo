import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Balance API called - fetching fresh user balance');
    
    // Require authentication
    const authUser = requireAuth(request);

    // Connect to database
    await dbConnect();

    // Get user's current balance from database
    const user = await User.findById(authUser.userId).select('_id name phone balance isAdmin');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Fresh balance fetched:', user.balance);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        balance: user.balance,
        isAdmin: user.isAdmin,
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user balance' },
      { status: 500 }
    );
  }
}
