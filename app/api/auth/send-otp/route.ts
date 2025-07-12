import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/otpStore';

export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json();

    if (!phone || !name) {
      return NextResponse.json(
        { error: 'Phone number and name are required' },
        { status: 400 }
      );
    }

    // Generate OTP (using dummy OTP for development)
    const otp = '123456'; // In production, generate random 6-digit OTP
    
    // Store OTP with phone and name
    otpStore.set(phone, otp, name);

    // In production, send OTP via SMS service
    console.log(`OTP for ${phone}: ${otp}`);

    return NextResponse.json({
      message: 'OTP sent successfully',
      // Don't send OTP in production
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
