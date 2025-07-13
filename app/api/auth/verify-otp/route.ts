import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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
    const storedData = await otpStore.get(phone);
    if (!storedData || storedData.otp !== otp) {
      console.log(`OTP verification failed for phone: ${phone}, stored: ${storedData ? 'exists' : 'not found'}`);
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Validate stored data
    if (!storedData.name || !storedData.phone) {
      console.error('Invalid stored data - missing name or phone:', storedData);
      return NextResponse.json(
        { error: 'Invalid registration data' },
        { status: 400 }
      );
    }

    // Connect to database
    try {
      await dbConnect();
      console.log('Database connection established');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Check if user exists
    let user = await User.findOne({ phone });
    
    if (!user) {
      try {
        console.log(`Creating new user for phone: ${storedData.phone}, name: ${storedData.name}`);
        
        // Generate unique referral code for new user with fallback
        console.log('Generating unique referral code...');
        let referralCode: string;
        try {
          referralCode = await generateUniqueReferralCode();
          console.log(`Generated referral code: ${referralCode}`);
        } catch (referralError) {
          console.error('Failed to generate unique referral code, using timestamp fallback:', referralError);
          // Fallback: use timestamp-based code
          const timestamp = Date.now().toString(36).toUpperCase();
          const random = Math.random().toString(36).substr(2, 4).toUpperCase();
          referralCode = `${timestamp}${random}`.substr(0, 8);
          
          // Check if this fallback code exists (unlikely but possible)
          const existingFallback = await User.findOne({ referralCode });
          if (existingFallback) {
            referralCode = `${referralCode}${Math.floor(Math.random() * 10)}`;
          }
        }
        
        // Validate referredBy if provided
        let referredByObjectId = undefined;
        if (storedData.referredBy) {
          console.log(`Validating referring user: ${storedData.referredBy}`);
          try {
            const referringUser = await User.findById(storedData.referredBy);
            if (!referringUser) {
              console.error(`Referring user not found: ${storedData.referredBy}`);
              // Continue without referral rather than failing
            } else {
              referredByObjectId = new mongoose.Types.ObjectId(storedData.referredBy);
              console.log(`Valid referring user found: ${referringUser.name}`);
            }
          } catch (referralValidationError) {
            console.error('Error validating referring user:', referralValidationError);
            // Continue without referral rather than failing
          }
        }
        
        // Create new user
        console.log('Creating user document...');
        const userData = {
          name: storedData.name?.trim(),
          phone: storedData.phone?.trim(),
          isAdmin: false,
          balance: 0,
          referralCode,
          ...(referredByObjectId && { referredBy: referredByObjectId }),
        };
        
        console.log('User data to save:', { ...userData, referredBy: referredByObjectId ? 'ObjectId' : undefined });
        
        user = new User(userData);
        
        console.log('Saving user to database...');
        await user.save();

        console.log(`New user created successfully: ${user.name} (${user.phone}) with referral code: ${referralCode}`);

        // If user was referred, log the referral relationship
        if (referredByObjectId) {
          console.log(`New user ${user.name} was referred by user ${storedData.referredBy}`);
          // Note: Referral rewards will be given when this user wins their first match
        }
      } catch (userCreationError) {
        console.error('Detailed error creating new user:', {
          error: userCreationError,
          message: userCreationError instanceof Error ? userCreationError.message : 'Unknown error',
          stack: userCreationError instanceof Error ? userCreationError.stack : undefined,
          storedData: {
            name: storedData.name,
            phone: storedData.phone,
            referredBy: storedData.referredBy
          }
        });
        
        // Provide more specific error messages
        let errorMessage = 'Failed to create user account';
        if (userCreationError instanceof Error) {
          if (userCreationError.message.includes('duplicate key') || userCreationError.message.includes('E11000')) {
            errorMessage = 'Phone number or referral code already exists';
          } else if (userCreationError.message.includes('validation')) {
            errorMessage = 'Invalid user data provided';
          } else if (userCreationError.message.includes('referral code')) {
            errorMessage = 'Failed to generate unique referral code';
          }
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
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
    await otpStore.delete(phone);

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
