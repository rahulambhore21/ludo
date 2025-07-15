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

export default function CreateMatchPage() {
  const [user, setUser] = useState<User | null>(null);
  const [entryFee, setEntryFee] = useState('');
  const [roomCode, setRoomCode] = useState('');
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
      showToast('success', 'Match created successfully! 🎮 Waiting for opponent...');
      
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
              <div className="dice-icon text-4xl">🎮</div>
            </div>
          </div>
          <p className="mt-4 text-white font-semibold text-lg">Setting up game creation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Floating decorative elements */}
      <div className="fixed top-10 left-10 float-animation opacity-20">
        <div className="text-6xl">🎮</div>
      </div>
      <div className="fixed top-20 right-20 float-animation opacity-20" style={{animationDelay: '1s'}}>
        <div className="text-5xl">🚀</div>
      </div>
      <div className="fixed bottom-20 left-20 float-animation opacity-20" style={{animationDelay: '2s'}}>
        <div className="text-4xl">⚡</div>
      </div>

      {/* Mobile Header */}
      <header className="game-card m-4 rounded-xl">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>

            {/* Balance */}
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full px-4 py-2 text-sm font-bold flex items-center space-x-2 pulse-glow">
              <span className="coin-icon">💰</span>
              <span>₹ {user.balance}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="game-card p-6 text-center coin-animation">
          <div className="dice-icon text-6xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Epic Match</h1>
          <p className="text-purple-600 font-semibold">
            🎮 Set up your arena and challenge players!
          </p>
        </div>

        {/* Quick Instructions */}
        <div className="game-card p-4 bg-gradient-to-r from-blue-100 to-purple-100">
          <div className="flex items-start space-x-3">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="font-bold text-blue-900 mb-3 flex items-center space-x-2">
                <span>🎯</span>
                <span>Battle Preparation Guide</span>
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <p>🎮 Open Ludo King & create a room</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <p>📋 Copy the room code here</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <p>💰 Set your entry fee & create battle</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <p>🚀 Wait for worthy opponents!</p>
                </div>
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

        {/* Create Match Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="game-card p-6 space-y-6">
            {/* Room Code Input */}
            <div>
              <label className="text-lg font-bold text-gray-800 mb-3 flex items-center space-x-2">
                <span className="dice-icon text-xl">🎮</span>
                <span>Battle Room Code</span>
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="w-full px-4 py-4 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xl font-bold text-center bg-white text-black shadow-lg"
                required
                maxLength={6}
              />
              <p className="mt-2 text-sm text-purple-600 text-center font-semibold">
                📱 Copy from Ludo King app
              </p>
            </div>

            {/* Entry Fee Input */}
            <div>
              <label className="text-lg font-bold text-gray-800 mb-3 flex items-center space-x-2">
                <span className="coin-icon text-xl">💰</span>
                <span>Battle Stakes</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-xl font-bold">₹</span>
                <input
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-4 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xl font-bold text-center text-black bg-white shadow-lg"
                  required
                  min="1"
                  max={user.balance}
                />
              </div>
              <div className="mt-3 flex justify-between text-sm bg-gray-100 rounded-lg p-2">
                <span className="text-gray-600 font-semibold">⚡ Min: ₹1</span>
                <span className="text-green-600 font-semibold">💰 Available: ₹{user.balance}</span>
              </div>
            </div>

            {/* Match Preview */}
            {entryFee && parseInt(entryFee) > 0 && (
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 border-2 border-yellow-300 coin-animation">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                  <span className="trophy-icon text-xl">🏆</span>
                  <span>Battle Preview</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-600">₹{parseInt(entryFee) * 2}</div>
                    <div className="text-gray-600 font-semibold">Total Prize Pool</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">₹{Math.floor((parseInt(entryFee) * 2) * 0.9)}</div>
                    <div className="text-gray-600 font-semibold">Winner Gets 🏆</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-600">₹{Math.floor((parseInt(entryFee) * 2) * 0.1)}</div>
                    <div className="text-gray-600 font-semibold">Platform Fee</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">₹{entryFee}</div>
                    <div className="text-gray-600 font-semibold">Your Entry ⚡</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !entryFee || !roomCode || parseInt(entryFee) > user.balance}
            className="w-full game-button text-xl font-bold py-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>🚀 Creating Epic Battle...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>🚀</span>
                <span>Launch Battle Arena</span>
                <span>⚡</span>
              </div>
            )}
          </button>
        </form>

        {/* Quick Entry Fee Options */}
        <div className="game-card p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span className="dice-icon text-xl">⚡</span>
            <span>Quick Stakes</span>
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {[10, 25, 50, 100].filter(amount => amount <= user.balance).map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setEntryFee(amount.toString())}
                className="p-3 text-sm font-bold bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <span className="coin-icon">💰</span>
                <span>₹{amount}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Insufficient Balance Warning */}
        {user.balance < 10 && (
          <div className="game-card p-4 bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">⚠️</span>
              <span className="text-yellow-800 font-bold text-lg">Low Battle Funds!</span>
            </div>
            <p className="text-sm text-yellow-700 mb-4 font-semibold">
              🪙 You need more coins to create epic battles! Add coins and dominate the arena!
            </p>
            <Link
              href="/wallet/deposit"
              className="game-button inline-flex items-center px-6 py-3 text-sm space-x-2"
            >
              <span className="coin-icon">💰</span>
              <span>Add Battle Coins</span>
            </Link>
          </div>
        )}

        {/* Bottom Padding */}
        <div className="h-8"></div>
      </main>
    </div>
  );
}
