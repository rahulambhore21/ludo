// Test script to register a new user with referral code
const { default: fetch } = require('node-fetch');

async function testReferralRegistration() {
  const baseUrl = 'http://localhost:3000';
  const referralCode = 'F773421B';
  const testUser = {
    name: 'Test User',
    phone: '9876543210'
  };

  try {
    console.log('Step 1: Sending OTP with referral code...');
    
    // Step 1: Send OTP with referral code
    const otpResponse = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: testUser.phone,
        name: testUser.name,
        referralCode: referralCode
      }),
    });

    const otpData = await otpResponse.json();
    console.log('OTP Response:', otpData);

    if (!otpResponse.ok) {
      console.error('Failed to send OTP:', otpData);
      return;
    }

    // Step 2: Verify OTP (using the development OTP 123456)
    console.log('Step 2: Verifying OTP...');
    
    const verifyResponse = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: testUser.phone,
        otp: '123456'
      }),
    });

    const verifyData = await verifyResponse.json();
    console.log('Verify Response:', verifyData);

    if (verifyResponse.ok) {
      console.log('✅ Registration successful!');
      console.log('New user created:', verifyData.user);
      console.log('✅ Referral rewards should be processed');
    } else {
      console.error('❌ Verification failed:', verifyData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testReferralRegistration();
