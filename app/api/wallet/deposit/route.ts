import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authUser = requireAuth(request);

    // Parse FormData
    const formData = await request.formData();
    const amount = formData.get('amount') as string;
    const proofFile = formData.get('proof') as File;

    if (!amount || !proofFile) {
      return NextResponse.json(
        { error: 'Amount and proof image are required' },
        { status: 400 }
      );
    }

    const depositAmount = parseInt(amount);
    if (depositAmount < 1) {
      return NextResponse.json(
        { error: 'Amount must be at least 1' },
        { status: 400 }
      );
    }

    // Convert file to buffer for Cloudinary upload
    const bytes = await proofFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    let proofUrl = '';
    try {
      const fileName = `${authUser.userId}_${Date.now()}`;
      proofUrl = await uploadToCloudinary(buffer, fileName);
    } catch (uploadError) {
      // If Cloudinary is not configured, use a placeholder
      console.warn('Cloudinary upload failed, using placeholder:', uploadError);
      proofUrl = `/api/placeholder-image?filename=${proofFile.name}`;
    }

    // Connect to database
    await dbConnect();

    // Create transaction record
    const transaction = new Transaction({
      userId: authUser.userId,
      type: 'deposit',
      amount: depositAmount,
      status: 'pending',
      proofUrl,
    });

    await transaction.save();

    return NextResponse.json({
      message: 'Deposit request submitted successfully',
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Deposit error:', error);
    return NextResponse.json(
      { error: 'Failed to submit deposit request' },
      { status: 500 }
    );
  }
}
