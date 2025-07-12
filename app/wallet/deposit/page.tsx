'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { refreshUserBalance } from '@/lib/userUtils';

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

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-600 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>

            {/* Current Balance */}
            <div className="bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 text-sm font-semibold">
              ₹ {user.balance}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Add Coins</h1>
          <p className="text-gray-600">Fund your wallet to play matches</p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">💳</span>
            <h3 className="text-lg font-semibold">Payment Details</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm opacity-90 mb-1">UPI ID</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-mono font-semibold">ludo@paytm</p>
                <button
                  onClick={() => navigator.clipboard.writeText('ludo@paytm')}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div className="bg-white/20 rounded-lg p-4 text-center">
              <p className="text-sm opacity-90 mb-2">QR Code</p>
              <div className="w-32 h-32 mx-auto bg-white/30 rounded-lg flex items-center justify-center">
                <span className="text-4xl">📱</span>
              </div>
              <p className="text-xs opacity-75 mt-2">Scan to pay instantly</p>
            </div>
            
            <div className="bg-yellow-400/20 border border-yellow-300/30 rounded-lg p-3 text-center">
              <p className="font-semibold">₹1 = 1 Coin</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-green-700 font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Deposit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 Amount to Add
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                  required
                  min="1"
                />
              </div>
              <p className="mt-2 text-sm text-gray-600">
                You will receive <span className="font-semibold text-emerald-600">{amount || '0'} coins</span>
              </p>
            </div>

            {/* Quick Amount Selection */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Select</p>
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, 1000].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(value.toString())}
                    className="p-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border"
                  >
                    ₹{value}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Payment Proof */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📸 Payment Screenshot
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors">
                {previewUrl ? (
                  <div className="space-y-3">
                    <img 
                      src={previewUrl} 
                      alt="Payment proof preview" 
                      className="mx-auto max-h-40 rounded-lg shadow-sm"
                    />
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-green-600 text-sm font-medium">✓ Image uploaded</span>
                      <button
                        type="button"
                        onClick={() => {
                          setProofFile(null);
                          setPreviewUrl(null);
                          const fileInput = document.getElementById('proof') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        className="text-red-600 text-sm underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Upload payment screenshot</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
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
                    className="mt-3 inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors"
                  >
                    Choose File
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !amount || !proofFile}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-lg font-semibold py-4 rounded-xl transition-all duration-200 active:scale-95 disabled:active:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              '🚀 Submit Deposit Request'
            )}
          </button>
        </form>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How to Add Coins</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>1. Pay ₹{amount || 'X'} to ludo@paytm</p>
                <p>2. Take screenshot of payment</p>
                <p>3. Upload screenshot above</p>
                <p>4. Submit & wait for admin approval</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Access</h3>
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
