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
            <h1 className="text-2xl font-bold text-gray-900">Create Match</h1>
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
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">How It Works</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Create a room in Ludo King app</li>
            <li>• Enter the room code here along with entry fee</li>
            <li>• Wait for another player to join your match</li>
            <li>• Play the game in Ludo King</li>
            <li>• Both players submit win/loss result</li>
            <li>• Winner gets 90% of total pot, platform keeps 10%</li>
          </ul>
        </div>

        {/* Create Match Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Match</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="entryFee" className="block text-sm font-medium text-gray-700">
                Entry Fee (Coins)
              </label>
              <input
                type="number"
                id="entryFee"
                min="1"
                max={user.balance}
                step="1"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter coins to bet"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                Total pot will be {entryFee ? parseInt(entryFee) * 2 : 0} coins
              </p>
            </div>

            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700">
                Ludo King Room Code
              </label>
              <input
                type="text"
                id="roomCode"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter room code from Ludo King"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                Create a room in Ludo King and enter the code here
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
              disabled={loading || !entryFee || !roomCode || parseInt(entryFee) > user.balance}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Match'}
            </button>
          </form>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-center space-x-4">
          <Link
            href="/match/browse"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Browse Matches
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/match/history"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Match History
          </Link>
        </div>
      </main>
    </div>
  );
}
