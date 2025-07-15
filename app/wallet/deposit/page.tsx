'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { refreshUserBalance } from '@/lib/userUtils';
import { useNotifications } from '../../../contexts/NotificationContext';

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  balance: number;
}

export default function DepositPage() {
  const [user, setUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useNotifications();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      
      setProofFile(file);
      setError('');
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !proofFile) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('proof', proofFile);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit deposit');
      }

      setSuccess('Deposit request submitted successfully! It will be reviewed by admin.');
      setAmount('');
      setProofFile(null);
      setPreviewUrl(null);
      
      // Reset file input
      const fileInput = document.getElementById('proof') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh user balance
      refreshUserBalance();
      showToast('success', 'Deposit request submitted successfully! 💰');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      showToast('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-yellow-400 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="dice-icon text-4xl">💰</div>
            </div>
          </div>
          <p className="mt-4 text-white font-semibold text-lg">Loading wallet magic...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Floating decorative elements */}
      <div className="fixed top-10 left-10 float-animation opacity-20">
        <div className="text-6xl">💰</div>
      </div>
      <div className="fixed top-20 right-20 float-animation opacity-20" style={{animationDelay: '1s'}}>
        <div className="text-5xl">💎</div>
      </div>
      <div className="fixed bottom-20 left-20 float-animation opacity-20" style={{animationDelay: '2s'}}>
        <div className="text-4xl">🚀</div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 game-card m-2 rounded-xl">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-bold">Back to Arena</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">💰</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Add Coins</span>
            </div>

            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full px-3 py-1 text-sm font-bold flex items-center space-x-1">
              <span className="coin-icon">💰</span>
              <span>₹ {user.balance}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="game-card p-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="dice-icon text-3xl">💸</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Power Up Your Wallet!</h1>
              <p className="text-purple-600 font-semibold">Add coins to dominate the arena! 💪</p>
            </div>
          </div>
        </div>

        {/* Payment Details Card */}
        <div className="game-card p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">💳</span>
            <h3 className="text-lg font-semibold">Battle Fund Transfer Details</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm opacity-90 mb-1 font-semibold">🎯 UPI ID</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-mono font-bold">ludo@paytm</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('ludo@paytm');
                    showToast('success', 'UPI ID copied! 📋');
                  }}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm transition-colors font-bold"
                >
                  📋 Copy
                </button>
              </div>
            </div>
            
            <div className="bg-white/20 rounded-lg p-4 text-center">
              <p className="text-sm opacity-90 mb-2 font-semibold">📱 QR Code</p>
              <div className="w-32 h-32 mx-auto bg-white/30 rounded-lg flex items-center justify-center">
                <span className="text-4xl">📱</span>
              </div>
              <p className="text-xs opacity-75 mt-2">Scan to pay instantly</p>
            </div>
            
            <div className="bg-yellow-400/20 border border-yellow-300/30 rounded-lg p-3 text-center">
              <p className="font-bold text-yellow-800">⚡ ₹1 = 1 Battle Coin ⚡</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="game-card p-4 bg-gradient-to-r from-green-100 to-green-200 border-2 border-green-400 coin-animation">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎉</span>
              <span className="text-green-800 font-bold">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="game-card p-4 bg-gradient-to-r from-red-100 to-red-200 border-2 border-red-400">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚠️</span>
              <span className="text-red-800 font-bold">{error}</span>
            </div>
          </div>
        )}

        {/* Deposit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="game-card p-6 space-y-6">
            {/* Amount Input */}
            <div>
              <label className="text-lg font-bold text-gray-800 mb-3 flex items-center space-x-2">
                <span className="coin-icon text-xl">💰</span>
                <span>Battle Fund Amount</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-xl font-bold">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-4 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xl font-bold text-center text-black bg-white shadow-lg"
                  required
                  min="1"
                />
              </div>
              <p className="mt-2 text-sm text-purple-600 text-center font-semibold">
                💎 You will receive <span className="text-green-600 font-bold">{amount || '0'} Battle Coins</span>
              </p>
            </div>

            {/* Quick Amount Selection */}
            <div>
              <p className="text-lg font-bold text-gray-800 mb-3 flex items-center space-x-2">
                <span>⚡</span>
                <span>Quick Battle Fund</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[100, 250, 500, 1000].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(value.toString())}
                    className="bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg"
                  >
                    💰₹{value}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Payment Proof */}
            <div>
              <label className="text-lg font-bold text-gray-800 mb-3 flex items-center space-x-2">
                <span className="text-xl">📸</span>
                <span>Payment Victory Screenshot</span>
              </label>
              <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-500 transition-colors bg-purple-50">
                {previewUrl ? (
                  <div className="space-y-3">
                    <img 
                      src={previewUrl} 
                      alt="Payment proof preview" 
                      className="mx-auto max-h-40 rounded-lg shadow-lg border-2 border-purple-200"
                    />
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-green-600 text-sm font-bold flex items-center space-x-1">
                        <span>✅</span>
                        <span>Victory Screenshot Uploaded!</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setProofFile(null);
                          setPreviewUrl(null);
                          const fileInput = document.getElementById('proof') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        className="text-red-600 text-sm underline font-bold"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">📸</span>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800">Upload Payment Proof</p>
                      <p className="text-sm text-purple-600 font-semibold">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  id="proof"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                  required
                />
                {!previewUrl && (
                  <label
                    htmlFor="proof"
                    className="mt-3 inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white text-sm font-bold rounded-lg cursor-pointer transition-all duration-300 hover:shadow-lg"
                  >
                    📂 Choose Battle Proof
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !amount || !proofFile}
            className="game-button w-full text-lg font-bold rounded-xl py-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Processing Battle Fund...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Submit Deposit Request</span>
              </>
            )}
          </button>
        </form>

        {/* Instructions */}
        <div className="game-card p-6 bg-gradient-to-r from-blue-100 to-purple-100">
          <div className="flex items-start space-x-3">
            <span className="text-3xl">📋</span>
            <div>
              <h3 className="font-bold text-blue-900 mb-3 flex items-center space-x-2">
                <span>⚡</span>
                <span>Battle Fund Guide</span>
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <p className="font-semibold">💳 Pay ₹{amount || 'X'} to ludo@paytm</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <p className="font-semibold">📸 Capture payment victory screenshot</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <p className="font-semibold">📤 Upload proof above</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <p className="font-semibold">⏳ Await admin approval for coins</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="game-card p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center space-x-2">
            <span>⚡</span>
            <span>Quick Arena Access</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/wallet/history"
              className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg">📊</span>
              <span className="text-sm font-medium text-gray-700">History</span>
            </Link>
            <Link
              href="/wallet/withdraw"
              className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg">💸</span>
              <span className="text-sm font-medium text-gray-700">Withdraw</span>
            </Link>
          </div>
        </div>

        {/* Bottom Padding */}
        <div className="h-8"></div>
      </main>
    </div>
  );
}
