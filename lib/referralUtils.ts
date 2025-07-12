import crypto from 'crypto';
import User from '@/models/User';

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
  let referralCode: string;
  let isUnique = false;
  
  while (!isUnique) {
    referralCode = generateReferralCode();
    const existingUser = await User.findOne({ referralCode });
    if (!existingUser) {
      isUnique = true;
    }
  }
  
  return referralCode!;
}

/**
 * Validate if a referral code exists and return the referring user
 */
export async function validateReferralCode(referralCode: string) {
  if (!referralCode) return null;
  
  const referringUser = await User.findOne({ referralCode: referralCode.toUpperCase() });
  return referringUser;
}
