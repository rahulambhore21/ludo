'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { refreshUserBalance } from '@/lib/userUtils';

interface Match {
  id: string;
  player1: {
    _id: string;
    name: string;
    phone: string;
  };
  entryFee: number;
  pot: number;
  roomCode: string;
  status: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  balance: number;
}

export default function BrowseMatchesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningMatch, setJoiningMatch] = useState<string | null>(null);
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
      fetchMatches();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/match/browse', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch matches');
      }

      setMatches(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMatch = async (matchId: string, entryFee: number) => {
    if (!user) return;

    if (user.balance < entryFee) {
      setError('Insufficient balance to join this match');
      return;
    }

    setJoiningMatch(matchId);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/match/join/${matchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join match');
      }

      // Update user balance in localStorage
      const updatedUser = { ...user, balance: user.balance - entryFee };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Refresh balance from server
      await refreshUserBalance();

      // Redirect to match page
      router.push(`/match/${matchId}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setJoiningMatch(null);
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
            <h1 className="text-2xl font-bold text-gray-900">Browse Matches</h1>
            <Link 
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Current Balance */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Available Balance</h2>
          <p className="text-3xl font-bold text-green-600">{user.balance} Coins</p>
        </div>

        {/* Available Matches */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Available Matches</h3>
              <button
                onClick={fetchMatches}
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-600">Loading matches...</div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600">{error}</div>
            </div>
          ) : matches.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">No matches available</div>
              <Link
                href="/match/create"
                className="mt-2 inline-block text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Create a match
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {matches.map((match) => (
                <div key={match.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {match.player1.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {match.player1.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Room: {match.roomCode}
                          </p>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(match.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {match.entryFee} coins
                        </div>
                        <div className="text-sm text-gray-500">
                          Total pot: {match.pot} coins
                        </div>
                        <div className="text-xs text-gray-400">
                          Winner gets: {match.pot - Math.floor(match.pot * 0.1)} coins
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinMatch(match.id, match.entryFee)}
                        disabled={joiningMatch === match.id || user.balance < match.entryFee}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {joiningMatch === match.id ? 'Joining...' : 'Join Match'}
                      </button>
                    </div>
                  </div>
                  
                  {user.balance < match.entryFee && (
                    <div className="mt-3 text-sm text-red-600">
                      Insufficient balance to join this match
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-center space-x-4">
          <Link
            href="/match/create"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Create Match
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
