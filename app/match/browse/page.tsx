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
  const [refreshing, setRefreshing] = useState(false);
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
      
      // Poll for new matches every 5 seconds
      const pollInterval = setInterval(() => {
        fetchMatches();
      }, 5000);

      return () => clearInterval(pollInterval);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchMatches = async () => {
    try {
      setRefreshing(true);
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
      setRefreshing(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
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
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-yellow-400 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="dice-icon text-4xl">⚔️</div>
            </div>
          </div>
          <p className="mt-4 text-white font-semibold text-lg">Searching for worthy opponents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Floating decorative elements */}
      <div className="fixed top-10 left-10 float-animation opacity-20">
        <div className="text-6xl">⚔️</div>
      </div>
      <div className="fixed top-20 right-20 float-animation opacity-20" style={{animationDelay: '1s'}}>
        <div className="text-5xl">🏆</div>
      </div>
      <div className="fixed bottom-20 left-20 float-animation opacity-20" style={{animationDelay: '2s'}}>
        <div className="text-4xl">🎯</div>
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
                <span className="text-white text-sm">⚔️</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Battle Arena</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full px-3 py-1 text-sm font-bold flex items-center space-x-1">
                <span className="coin-icon">💰</span>
                <span>₹ {user.balance}</span>
              </div>
              <button
                onClick={fetchMatches}
                disabled={refreshing}
                className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="game-card p-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="dice-icon text-3xl">⚔️</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Battle Arena</h1>
              <p className="text-purple-600 font-semibold">Choose your opponent & claim victory! 🏆</p>
            </div>
          </div>
        </div>

        {/* Quick Create Button */}
        <Link
          href="/match/create"
          className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold rounded-xl py-3 text-center transition-all duration-200 active:scale-95"
        >
          ✨ Create New Match
        </Link>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Matches List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Matches</h3>
              <p className="text-gray-500 mb-4">Be the first to create a match and get the game started!</p>
              <Link
                href="/match/create"
                className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                🚀 Create Match
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <div key={match.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {match.player1.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{match.player1.name}</h3>
                        <p className="text-sm text-gray-500">{formatTimeAgo(match.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">₹{match.entryFee}</div>
                      <div className="text-xs text-gray-500">Entry Fee</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <span>🏆</span>
                        <span>₹{Math.floor(match.pot * 0.9)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>🎮</span>
                        <span className="font-mono">{match.roomCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {user.balance < match.entryFee ? (
                      <div className="flex-1 text-center">
                        <div className="text-sm text-red-600 font-medium mb-2">
                          Insufficient Balance
                        </div>
                        <Link
                          href="/wallet/deposit"
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Add Coins →
                        </Link>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoinMatch(match.id, match.entryFee)}
                        disabled={joiningMatch === match.id}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-all duration-200 active:scale-95 disabled:active:scale-100"
                      >
                        {joiningMatch === match.id ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Joining...</span>
                          </div>
                        ) : (
                          '🎯 Join Match'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        {matches.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/match/history"
                className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg">📊</span>
                <span className="text-sm font-medium text-gray-700">My History</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg">🏆</span>
                <span className="text-sm font-medium text-gray-700">Leaderboard</span>
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Padding */}
        <div className="h-8"></div>
      </main>
    </div>
  );
}
