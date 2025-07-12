const mongoose = require('mongoose');
const crypto = require('crypto');

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ludo';

// User schema (simplified)
const UserSchema = new mongoose.Schema({
  name: String,
  phone: String,
  isAdmin: Boolean,
  balance: Number,
  referralCode: String,
  referredBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
});

const User = mongoose.model('User', UserSchema);

// Generate referral code
function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function addReferralCodes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find users without referral codes
    const usersWithoutCodes = await User.find({
      $or: [
        { referralCode: { $exists: false } },
        { referralCode: null },
        { referralCode: '' }
      ]
    });

    console.log(`Found ${usersWithoutCodes.length} users without referral codes`);

    for (const user of usersWithoutCodes) {
      let referralCode;
      let isUnique = false;
      
      // Generate unique referral code
      while (!isUnique) {
        referralCode = generateReferralCode();
        const existingUser = await User.findOne({ referralCode });
        if (!existingUser) {
          isUnique = true;
        }
      }

      // Update user with referral code
      await User.findByIdAndUpdate(user._id, { referralCode });
      console.log(`Added referral code ${referralCode} to user ${user.name} (${user.phone})`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addReferralCodes();
