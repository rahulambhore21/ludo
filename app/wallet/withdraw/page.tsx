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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Withdraw Coins</h1>
            <Link 
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Current Balance */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Available Balance</h2>
          <p className="text-3xl font-bold text-green-600">{user.balance} Coins</p>
          <p className="text-sm text-gray-500 mt-1">= ₹{user.balance}</p>
        </div>

        {/* Withdrawal Guidelines */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-yellow-900 mb-4">Withdrawal Guidelines</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>• Minimum withdrawal: 10 coins (₹10)</li>
            <li>• Processing time: 24-48 hours</li>
            <li>• Rate: 1 Coin = ₹1</li>
            <li>• Valid UPI ID required</li>
          </ul>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Request Withdrawal</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount (Coins)
              </label>
              <input
                type="number"
                id="amount"
                min="10"
                max={user.balance}
                step="1"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter coins to withdraw"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                You will receive ₹{amount || '0'}
              </p>
            </div>

            <div>
              <label htmlFor="upiId" className="block text-sm font-medium text-gray-700">
                UPI ID
              </label>
              <input
                type="text"
                id="upiId"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="yourname@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter your UPI ID where you want to receive money
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !amount || !upiId || parseInt(amount) > user.balance}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Request Withdrawal'}
            </button>
          </form>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-center space-x-4">
          <Link
            href="/wallet/deposit"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Add Coins
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/wallet/history"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Transaction History
          </Link>
        </div>
      </main>
    </div>
  );
}
