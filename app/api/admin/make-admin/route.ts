import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find user by phone and make them admin
    const user = await User.findOneAndUpdate(
      { phone },
      { isAdmin: true },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `${user.name} is now an admin`,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        balance: user.balance,
      },
    });

  } catch (error) {
    console.error('Make admin error:', error);
    return NextResponse.json(
      { error: 'Failed to make user admin' },
      { status: 500 }
    );
  }
}
