'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterPageContent() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    referralCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for referral code in URL
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Store form data in localStorage for OTP verification
      localStorage.setItem('pendingAuth', JSON.stringify(formData));

      // Redirect to OTP page
      router.push('/auth/verify-otp');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Floating decorative elements */}
      <div className="fixed top-10 left-10 float-animation opacity-20">
        <div className="text-6xl">🎮</div>
      </div>
      <div className="fixed top-20 right-20 float-animation opacity-20" style={{animationDelay: '1s'}}>
        <div className="text-5xl">🚀</div>
      </div>
      <div className="fixed bottom-20 right-20 float-animation opacity-20" style={{animationDelay: '2s'}}>
        <div className="text-4xl">⭐</div>
      </div>

      <div className="max-w-md w-full space-y-8">
        <div className="game-card p-8 text-center coin-animation">
          <div className="dice-icon text-6xl mb-4">🎯</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Join the Arena
          </h2>
          <p className="text-purple-600 font-semibold">
            🎮 Register to start your gaming journey
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="game-card p-6 space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-bold text-gray-800 mb-2 flex items-center space-x-2">
                <span>👤</span>
                <span>Champion Name</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="text-sm font-bold text-gray-800 mb-2 flex items-center space-x-2">
                <span>📱</span>
                <span>Battle Phone</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="w-full px-4 py-3 border-2 border-green-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
                placeholder="Enter mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="referralCode" className="text-sm font-bold text-gray-800 mb-2 flex items-center space-x-2">
                <span>🎁</span>
                <span>Invite Code (Optional)</span>
              </label>
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-lg font-semibold"
                placeholder="Friend's referral code"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
              />
              <p className="mt-1 text-xs text-yellow-600 font-semibold">
                🎁 Get bonus coins with referral code!
              </p>
            </div>
          </div>

          {error && (
            <div className="game-card p-4 bg-gradient-to-r from-red-100 to-red-200 border-2 border-red-400">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">⚠️</span>
                <span className="text-red-800 font-bold">{error}</span>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full game-button text-lg font-bold py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>🚀 Sending Battle Code...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>⚡</span>
                  <span>Send Battle Code</span>
                  <span>📱</span>
                </div>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-white font-semibold bg-black bg-opacity-20 rounded-lg p-3">
              Already a champion?{' '}
              <Link href="/auth/login" className="text-yellow-300 font-bold hover:text-yellow-200 transition-colors">
                Login to Battle! 🎯
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
