import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';
import { otpStore } from '@/lib/otpStore';
import { generateUniqueReferralCode } from '@/lib/referralUtils';

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
    const storedData = otpStore.get(phone);
    if (!storedData || storedData.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Check if user exists
    let user = await User.findOne({ phone });
    
    if (!user) {
      // Generate unique referral code for new user
      const referralCode = await generateUniqueReferralCode();
      
      // Create new user
      user = new User({
        name: storedData.name,
        phone: storedData.phone,
        isAdmin: false,
        balance: 0,
        referralCode,
        referredBy: storedData.referredBy || undefined,
      });
      await user.save();

      // If user was referred, store the referral relationship
      if (storedData.referredBy) {
        console.log(`New user ${user.name} was referred by user ${storedData.referredBy}`);
        // Note: Referral rewards will be given when this user wins their first match
      }
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      phone: user.phone,
      name: user.name,
      isAdmin: user.isAdmin,
    });

    // Clear OTP from store
    otpStore.delete(phone);

    return NextResponse.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        balance: user.balance,
        referralCode: user.referralCode,
      },
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
