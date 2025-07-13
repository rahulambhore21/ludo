import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';
import { otpStore } from '@/lib/otpStore';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const storedData = await otpStore.get(phone);
    if (!storedData || storedData.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get user (should exist since we verified in login-otp)
    const user = await User.findOne({ phone });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      phone: user.phone,
      name: user.name,
      isAdmin: user.isAdmin,
    });

    // Clear OTP from store
    await otpStore.delete(phone);

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        balance: user.balance,
      },
    });

  } catch (error) {
    console.error('Verify login OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
