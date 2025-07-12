// Test script to simulate a match win by a referred user
const { default: fetch } = require('node-fetch');

async function testReferralMatchReward() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // First, let's create a test user with referral
    const referralCode = 'F773421B'; // Rahul's referral code
    const testUser = {
      name: 'Reward Test User',
      phone: '9876543211' // Different from previous test
    };

    console.log('Step 1: Registering new user with referral code...');
    
    // Send OTP
    const otpResponse = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testUser.phone,
        name: testUser.name,
        referralCode: referralCode
      }),
    });

    if (!otpResponse.ok) {
      console.error('Failed to send OTP');
      return;
    }

    // Verify OTP
    const verifyResponse = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testUser.phone,
        otp: '123456'
      }),
    });

    const userData = await verifyResponse.json();
    if (!verifyResponse.ok) {
      console.error('Failed to verify OTP:', userData);
      return;
    }

    console.log('✅ New user registered with referral');
    console.log('User data:', userData.user);
    
    // Note: In a real scenario, this user would need to:
    // 1. Create a match
    // 2. Have another player join
    // 3. Both submit results with this user winning
    // 4. This would trigger the referral reward

    console.log('🎯 Next steps to test referral rewards:');
    console.log('1. This user needs to create and win a match');
    console.log('2. The referrer will then get 1% of the match pot');
    console.log('3. Check the referrals page to see the reward');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testReferralMatchReward();
