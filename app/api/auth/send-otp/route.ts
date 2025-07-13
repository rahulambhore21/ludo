import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/otpStore';
import { validateReferralCode } from '@/lib/referralUtils';
import dbConnect from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { phone, name, referralCode } = await request.json();

    if (!phone || !name) {
      return NextResponse.json(
        { error: 'Phone number and name are required' },
        { status: 400 }
      );
    }

    // Connect to database first
    await dbConnect();

    // Validate referral code if provided
    let referringUser = null;
    if (referralCode) {
      try {
        referringUser = await validateReferralCode(referralCode);
        if (!referringUser) {
          return NextResponse.json(
            { error: 'Invalid referral code' },
            { status: 400 }
          );
        }
      } catch (refError) {
        console.error('Referral validation error:', refError);
        return NextResponse.json(
          { error: 'Error validating referral code' },
          { status: 500 }
        );
      }
    }

    // Generate OTP (using dummy OTP for development)
    const otp = '123456'; // In production, generate random 6-digit OTP
    
    // Store OTP with phone, name, and referral info
    await otpStore.set(phone, otp, name, referringUser?._id?.toString());

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
