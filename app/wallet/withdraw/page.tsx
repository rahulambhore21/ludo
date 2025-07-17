'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWalletBalance } from '../../../lib/useWalletBalance';
import { useNotifications } from '../../../contexts/NotificationContext';

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  balance: number;
}

export default function WithdrawPage() {
  const { user, setUser, refreshBalance } = useWalletBalance();
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
  }, [router, setUser]);

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
      showToast('success', 'Withdrawal request submitted successfully! 💸');
      setAmount('');
      setUpiId('');

      // Refresh user balance immediately
      await refreshBalance();

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
              <div className="dice-icon text-4xl">💸</div>
            </div>
          </div>
          <p className="mt-4 text-white font-semibold text-lg">Loading victory vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Floating decorative elements */}
      <div className="fixed top-10 left-10 float-animation opacity-20">
        <div className="text-6xl">💸</div>
      </div>
      <div className="fixed top-20 right-20 float-animation opacity-20" style={{animationDelay: '1s'}}>
        <div className="text-5xl">💎</div>
      </div>
      <div className="fixed bottom-20 left-20 float-animation opacity-20" style={{animationDelay: '2s'}}>
        <div className="text-4xl">🏦</div>
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
                <span className="text-white text-sm">💸</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Withdraw</span>
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
              <h1 className="text-2xl font-bold text-gray-800">Cash Out Victory!</h1>
              <p className="text-purple-600 font-semibold">Transform your battle coins to real money! 💪</p>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="game-card p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">💰</span>
            <h3 className="text-lg font-semibold">Victory Vault Balance</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-3xl font-bold">{user.balance} Battle Coins</p>
              <p className="text-green-100 font-semibold">= ₹{user.balance} Real Money</p>
            </div>
            
            <div className="bg-white/20 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-90 font-semibold">⚡ Min withdrawal:</span>
                <span className="font-bold">10 coins</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-90 font-semibold">⏱️ Processing time:</span>
                <span className="font-bold">24-48 hours</span>
              </div>
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

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="game-card p-6 space-y-6">
            {/* Amount Input */}
            <div>
              <label className="text-lg font-bold text-gray-800 mb-3 flex items-center space-x-2">
                <span className="coin-icon text-xl">💸</span>
                <span>Victory Cash Out Amount</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-xl font-bold">🪙</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="10"
                  max={user.balance}
                  className="w-full pl-12 pr-16 py-4 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xl font-bold text-center text-black bg-white shadow-lg"
                  required
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-sm font-bold">coins</span>
              </div>
              <p className="mt-2 text-sm text-purple-600 text-center font-semibold">
                💰 You will receive <span className="text-green-600 font-bold">₹{amount || '0'} real money</span>
              </p>
            </div>

            {/* Quick Amount Selection */}
            <div>
              <p className="text-lg font-bold text-gray-800 mb-3 flex items-center space-x-2">
                <span>⚡</span>
                <span>Quick Cash Out</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
