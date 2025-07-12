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

export default function CreateMatchPage() {
  const [user, setUser] = useState<User | null>(null);
  const [entryFee, setEntryFee] = useState('');
  const [roomCode, setRoomCode] = useState('');
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

    const fee = parseInt(entryFee);
    
    // Validate entry fee
    if (fee > user.balance) {
      setError('Insufficient balance');
      return;
    }

    if (fee < 1) {
      setError('Entry fee must be at least 1 coin');
      return;
    }

    if (!roomCode.trim()) {
      setError('Room code is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/match/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          entryFee: fee,
          roomCode: roomCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create match');
      }

      setSuccess('Match created successfully! Waiting for opponent...');
      
      // Update user balance in localStorage
      const updatedUser = { ...user, balance: user.balance - fee };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Refresh user balance from server
      await refreshUserBalance();

      // Redirect to match page after a delay
      setTimeout(() => {
        router.push(`/match/${data.match.id}`);
      }, 2000);

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
          <p className="text-gray-600 font-medium">Setting up match creation...</p>
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

            {/* Balance */}
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
          <h1 className="text-2xl font-bold text-gray-900">Create New Match</h1>
          <p className="text-gray-600">Set up your game and wait for opponents</p>
        </div>

        {/* Quick Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Quick Setup Guide</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>1. Open Ludo King & create a room</p>
                <p>2. Copy the room code here</p>
                <p>3. Set your entry fee & create match</p>
                <p>4. Share with friends or wait for players</p>
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

        {/* Create Match Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            {/* Room Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎮 Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter Ludo King room code"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono text-center"
                required
                maxLength={6}
              />
              <p className="mt-1 text-xs text-gray-500">
                Copy the room code from Ludo King app
              </p>
            </div>

            {/* Entry Fee Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 Entry Fee
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">₹</span>
                <input
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                  required
                  min="1"
                  max={user.balance}
                />
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-500">Min: ₹1</span>
                <span className="text-gray-500">Available: ₹{user.balance}</span>
              </div>
            </div>

            {/* Match Preview */}
            {entryFee && parseInt(entryFee) > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Match Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Pot:</span>
                    <span className="ml-2 font-semibold">₹{parseInt(entryFee) * 2}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Winner Gets:</span>
                    <span className="ml-2 font-semibold text-green-600">
                      ₹{Math.floor((parseInt(entryFee) * 2) * 0.9)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Platform Fee:</span>
                    <span className="ml-2 text-gray-600">₹{Math.floor((parseInt(entryFee) * 2) * 0.1)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Your Cost:</span>
                    <span className="ml-2 font-semibold text-red-600">₹{entryFee}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !entryFee || !roomCode || parseInt(entryFee) > user.balance}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-lg font-semibold py-4 rounded-xl transition-all duration-200 active:scale-95 disabled:active:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Match...</span>
              </div>
            ) : (
              '🚀 Create Match'
            )}
          </button>
        </form>

        {/* Quick Entry Fee Options */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Select</h3>
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].filter(amount => amount <= user.balance).map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setEntryFee(amount.toString())}
                className="p-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ₹{amount}
              </button>
            ))}
          </div>
        </div>

        {/* Insufficient Balance Warning */}
        {user.balance < 10 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-yellow-500">⚠️</span>
              <span className="text-yellow-800 font-medium">Low Balance</span>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              You need more coins to create matches. Add coins to get started!
            </p>
            <Link
              href="/wallet/deposit"
              className="inline-flex items-center bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              💰 Add Coins
            </Link>
          </div>
        )}

        {/* Bottom Padding */}
        <div className="h-8"></div>
      </main>
    </div>
  );
}
