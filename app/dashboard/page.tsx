'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  balance: number;
}

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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [walletOpen, setWalletOpen] = useState(false);
  const [joiningMatch, setJoiningMatch] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/register');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      router.push('/auth/register');
      return;
    }

    setLoading(false);
    
    // Fetch available matches
    fetchMatches(true);

    // Set up auto-refresh for matches every 10 seconds
    const matchesInterval = setInterval(() => {
      fetchMatches();
    }, 10000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(matchesInterval);
    };
  }, [router]);

  const fetchMatches = async (showLoading = false) => {
    try {
      if (showLoading) setMatchesLoading(true);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/match/browse', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches?.slice(0, 4) || []); // Show only first 4 matches
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      if (showLoading) setMatchesLoading(false);
    }
  };

  const handleJoinMatch = async (matchId: string) => {
    setJoiningMatch(matchId);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/match/join/${matchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/match/${matchId}`);
      } else {
        alert(data.error || 'Failed to join match');
      }
    } catch (error) {
      console.error('Error joining match:', error);
      alert('Failed to join match. Please try again.');
    } finally {
      setJoiningMatch(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/auth/register');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-600 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your game...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">🎲</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Ludo</span>
            </div>

            {/* Wallet Pill */}
            <div className="relative">
              <button
                onClick={() => setWalletOpen(!walletOpen)}
                className="bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 text-sm font-semibold flex items-center space-x-1 hover:bg-emerald-200 transition-colors"
              >
                <span>₹ {user.balance}</span>
                <svg className={`w-4 h-4 transition-transform ${walletOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Wallet Dropdown */}
              {walletOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setWalletOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-2 space-y-1">
                      <Link
                        href="/wallet/deposit"
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setWalletOpen(false)}
                      >
                        ➕ Add Coins
                      </Link>
                      <Link
                        href="/wallet/withdraw"
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setWalletOpen(false)}
                      >
                        ➖ Withdraw
                      </Link>
                      <Link
                        href="/wallet/history"
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setWalletOpen(false)}
                      >
                        📜 History
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          setWalletOpen(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Play Arena */}
      <main className="px-4 py-6 space-y-6">
        {/* Welcome & Play Section */}
        <div className="text-center space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Ready to Play?</h1>
            <p className="text-gray-600">Hello, {user.name}! �</p>
          </div>

          {/* Main Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/match/create"
              className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold rounded-xl py-3 transition-all duration-200 active:scale-95"
            >
              ✅ Create Match
            </Link>
            <Link
              href="/match/browse"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl py-3 transition-all duration-200 active:scale-95"
            >
              🔗 Browse All Matches
            </Link>
          </div>
        </div>

        {/* Quick Join Matches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Quick Join</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchMatches(true)}
                disabled={matchesLoading}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh matches"
              >
                <svg className={`w-4 h-4 ${matchesLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              {matches.length > 0 && (
                <Link 
                  href="/match/browse"
                  className="text-sm text-emerald-600 font-medium"
                >
                  View All
                </Link>
              )}
            </div>
          </div>

          {matchesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-3">
              {matches.map((match) => (
                <div key={match.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {match.player1.name}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(match.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <span>Entry: ₹{match.entryFee}</span>
                        <span>•</span>
                        <span>Win: ₹{Math.floor(match.pot * 0.9)}</span>
                        <span>•</span>
                        <span className="font-mono">{match.roomCode}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinMatch(match.id)}
                      disabled={joiningMatch === match.id}
                      className="ml-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 whitespace-nowrap"
                    >
                      {joiningMatch === match.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Join'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No matches available</h3>
              <p className="text-xs text-gray-500 mb-4">Be the first to create a match!</p>
              <Link
                href="/match/create"
                className="inline-flex items-center text-sm text-emerald-600 font-medium"
              >
                Create Match →
              </Link>
            </div>
          )}
        </div>

        {/* Quick Access Menu */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/match/history"
              className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg">📊</span>
              <span className="text-sm font-medium text-gray-700">History</span>
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg">🏆</span>
              <span className="text-sm font-medium text-gray-700">Leaderboard</span>
            </Link>
            <Link
              href="/referrals"
              className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg">🎁</span>
              <span className="text-sm font-medium text-gray-700">Referrals</span>
            </Link>
            {user.isAdmin && (
              <Link
                href="/admin"
                className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <span className="text-lg">👑</span>
                <span className="text-sm font-medium text-red-700">Admin</span>
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Padding for mobile navigation */}
        <div className="h-8"></div>
      </main>
    </div>
  );
}
