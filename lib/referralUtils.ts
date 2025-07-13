import crypto from 'crypto';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

/**
 * Generate a unique 8-character referral code
 */
export function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Generate a unique referral code that doesn't exist in the database
 */
export async function generateUniqueReferralCode(): Promise<string> {
  try {
    await dbConnect();
    
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      referralCode = generateReferralCode();
      const existingUser = await User.findOne({ referralCode });
      if (!existingUser) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      throw new Error('Unable to generate unique referral code after maximum attempts');
    }
    
    return referralCode!;
  } catch (error) {
    console.error('Error generating unique referral code:', error);
    throw new Error('Failed to generate referral code');
  }
}

/**
 * Validate if a referral code exists and return the referring user
 */
export async function validateReferralCode(referralCode: string) {
  try {
    if (!referralCode) return null;
    
    await dbConnect();
    
    const referringUser = await User.findOne({ referralCode: referralCode.toUpperCase() });
    return referringUser;
  } catch (error) {
    console.error('Error validating referral code:', error);
    throw new Error('Failed to validate referral code');
  }
}
