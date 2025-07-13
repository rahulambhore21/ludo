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
    const maxAttempts = 20; // Increased from 10 to 20
    
    while (!isUnique && attempts < maxAttempts) {
      referralCode = generateReferralCode();
      console.log(`Attempt ${attempts + 1}: Generated referral code ${referralCode}`);
      
      try {
        const existingUser = await User.findOne({ referralCode });
        if (!existingUser) {
          isUnique = true;
          console.log(`Referral code ${referralCode} is unique`);
        } else {
          console.log(`Referral code ${referralCode} already exists, trying again`);
        }
      } catch (dbError) {
        console.error('Database error while checking referral code uniqueness:', dbError);
        // Don't throw here, just try with a new code
      }
      
      attempts++;
    }
    
    if (!isUnique) {
      console.error(`Unable to generate unique referral code after ${maxAttempts} attempts`);
      throw new Error(`Unable to generate unique referral code after ${maxAttempts} attempts`);
    }
    
    return referralCode!;
  } catch (error) {
    console.error('Error generating unique referral code:', error);
    throw new Error(`Failed to generate referral code: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
