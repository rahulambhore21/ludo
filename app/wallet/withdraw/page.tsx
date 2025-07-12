'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { refreshUserBalance, updateUserInStorage } from '@/lib/userUtils';

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  balance: number;
}

export default function WithdrawPage() {
  const [user, setUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const withdrawAmount = parseInt(amount);
    
    // Validate amount
    if (withdrawAmount > user.balance) {
      setError('Insufficient balance');
      return;
    }

    if (withdrawAmount < 10) {
      setError('Minimum withdrawal amount is 10 coins');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: withdrawAmount,
          upiId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit withdrawal request');
      }

      setSuccess('Withdrawal request submitted successfully! It will be processed by admin.');
      setAmount('');
      setUpiId('');

      // Refresh user balance immediately
      const balanceData = await refreshUserBalance();
      if (balanceData) {
        setUser(prev => prev ? { ...prev, balance: balanceData.balance } : null);
      }

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
          <h1 className="text-2xl font-bold text-gray-900">Withdraw Money</h1>
          <p className="text-gray-600">Convert your coins to cash</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">💰</span>
            <h3 className="text-lg font-semibold">Available Balance</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-3xl font-bold">{user.balance} Coins</p>
              <p className="text-green-100">= ₹{user.balance}</p>
            </div>
            
            <div className="bg-white/20 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-90">Min withdrawal:</span>
                <span className="font-semibold">10 coins</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-90">Processing time:</span>
                <span className="font-semibold">24-48 hours</span>
              </div>
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

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💸 Amount to Withdraw
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">🪙</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="10"
                  max={user.balance}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">coins</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                You will receive <span className="font-semibold text-emerald-600">₹{amount || '0'}</span>
              </p>
            </div>

            {/* Quick Amount Selection */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Select</p>
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, user.balance].filter(value => value <= user.balance && value >= 10).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(value.toString())}
                    className="p-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border"
                  >
                    {value === user.balance ? 'All' : `${value}`}
                  </button>
                ))}
              </div>
            </div>

            {/* UPI ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏦 UPI ID
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@paytm"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Money will be sent to this UPI ID
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !amount || !upiId || parseInt(amount) > user.balance || parseInt(amount) < 10}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-lg font-semibold py-4 rounded-xl transition-all duration-200 active:scale-95 disabled:active:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              '💸 Request Withdrawal'
            )}
          </button>
        </form>

        {/* Guidelines */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">Withdrawal Guidelines</h3>
              <div className="space-y-1 text-sm text-orange-800">
                <p>• Minimum withdrawal: 10 coins (₹10)</p>
                <p>• Maximum: Your current balance</p>
                <p>• Processing: 24-48 hours</p>
                <p>• Valid UPI ID required</p>
                <p>• Money sent directly to your UPI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/wallet/deposit"
              className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg">💳</span>
              <span className="text-sm font-medium text-gray-700">Add Coins</span>
            </Link>
            <Link
              href="/wallet/history"
              className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg">📊</span>
              <span className="text-sm font-medium text-gray-700">History</span>
            </Link>
          </div>
        </div>

        {/* Bottom Padding */}
        <div className="h-8"></div>
      </main>
    </div>
  );
}
