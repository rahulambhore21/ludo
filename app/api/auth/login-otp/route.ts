import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { otpStore } from '@/lib/otpStore';

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

    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return NextResponse.json(
        { error: 'User not registered. Please register first.' },
        { status: 404 }
      );
    }

    // Generate OTP (using dummy OTP for development)
    const otp = '123456'; // In production, generate random 6-digit OTP
    
    // Store OTP with phone and user data
    await otpStore.set(phone, otp, user.name);

    // In production, send OTP via SMS service
    console.log(`Login OTP for ${phone}: ${otp}`);

    return NextResponse.json({
      message: 'OTP sent successfully',
      // Don't send OTP in production
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });

  } catch (error) {
    console.error('Send login OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
