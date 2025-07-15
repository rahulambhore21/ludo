'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Store phone for OTP verification
      localStorage.setItem('loginPhone', phone);

      // Redirect to OTP page
      router.push('/auth/login-verify-otp');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Floating decorative elements */}
      <div className="fixed top-10 left-10 float-animation opacity-20">
        <div className="text-6xl">🎮</div>
      </div>
      <div className="fixed top-20 right-20 float-animation opacity-20" style={{animationDelay: '1s'}}>
        <div className="text-5xl">🎯</div>
      </div>
      <div className="fixed bottom-20 left-20 float-animation opacity-20" style={{animationDelay: '2s'}}>
        <div className="text-4xl">🏆</div>
      </div>

      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="game-card p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">🎲</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Welcome Back, Champion! 🏆
            </h2>
            <p className="text-gray-600 font-semibold">
              🚀 Ready to dominate the arena? Let's get you logged in!
            </p>
          </div>
          
          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="game-card p-6 space-y-4">
              <div>
                <label className="text-lg font-bold text-gray-800 mb-3 flex items-center space-x-2">
                  <span className="text-xl">📱</span>
                  <span>Phone Number</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="w-full px-4 py-4 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-bold text-center bg-white text-black shadow-lg"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="mt-2 text-sm text-purple-600 text-center font-semibold">
                  🔐 We'll send you a secure OTP
                </p>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 rounded-lg p-3">
                  <div className="text-red-700 text-sm text-center font-semibold flex items-center justify-center space-x-2">
                    <span>❌</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="game-button w-full text-lg font-bold rounded-xl py-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Sending Magic Code...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Send OTP</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="game-card p-4 text-center">
            <p className="text-gray-600 font-semibold flex items-center justify-center space-x-2">
              <span>🆕</span>
              <span>New to the arena?</span>
            </p>
            <Link 
              href="/auth/register" 
              className="mt-2 inline-block bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-bold px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg"
            >
              🚀 Join the Battle!
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
