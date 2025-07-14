'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NotificationBell from '../../components/NotificationBell';
import { useNotifications } from '../../contexts/NotificationContext';

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
  const { showToast } = useNotifications();

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
        showToast('success', 'Successfully joined the match! 🎮');
        router.push(`/match/${matchId}`);
      } else {
        showToast('error', data.error || 'Failed to join match');
      }
    } catch (error) {
      console.error('Error joining match:', error);
      showToast('error', 'Failed to join match. Please try again.');
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
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-yellow-400 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="dice-icon text-4xl">🎲</div>
            </div>
          </div>
          <p className="mt-4 text-white font-semibold text-lg">Loading your game arena...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="text-white text-xl">🚀 Redirecting to game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Floating decorative elements */}
      <div className="fixed top-10 left-10 float-animation opacity-20">
        <div className="text-6xl">🎯</div>
      </div>
      <div className="fixed top-20 right-20 float-animation opacity-20" style={{animationDelay: '1s'}}>
        <div className="text-5xl">🏆</div>
      </div>
      <div className="fixed bottom-20 left-20 float-animation opacity-20" style={{animationDelay: '2s'}}>
        <div className="text-4xl">💎</div>
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 game-card m-2 rounded-xl">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🎲</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Ludo Champions</span>
            </div>

            {/* Center: Notification Bell */}
            <div className="flex-1 flex justify-center">
              <NotificationBell />
            </div>

            {/* Wallet Pill */}
            <div className="relative">
              <button
                onClick={() => setWalletOpen(!walletOpen)}
                className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full px-4 py-2 text-sm font-bold flex items-center space-x-2 hover:shadow-lg transition-all duration-300 pulse-glow"
              >
                <span className="coin-icon">💰</span>
                <span>₹ {user.balance}</span>
                <svg className={`w-4 h-4 transition-transform ${walletOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Wallet Dropdown */}
              {walletOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setWalletOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-48 game-card z-50">
                    <div className="p-2 space-y-1">
                      <Link
                        href="/wallet/deposit"
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors font-medium"
                        onClick={() => setWalletOpen(false)}
                      >
                        💸 Add Coins
                      </Link>
                      <Link
                        href="/wallet/withdraw"
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors font-medium"
                        onClick={() => setWalletOpen(false)}
                      >
                        💳 Withdraw
                      </Link>
                      <Link
                        href="/wallet/history"
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors font-medium"
                        onClick={() => setWalletOpen(false)}
                      >
                        � Transaction History
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          setWalletOpen(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
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
        <div className="game-card p-6 text-center coin-animation">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="dice-icon text-3xl">🎮</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Game Arena</h1>
                <p className="text-purple-600 font-semibold">Welcome back, {user.name}! 🚀</p>
              </div>
            </div>

            {/* User Stats Bar */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-3 text-white text-center">
                <div className="text-xl font-bold">🏅</div>
                <div className="text-xs font-semibold">Champion</div>
              </div>
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg p-3 text-white text-center">
                <div className="text-xl font-bold">⚡</div>
                <div className="text-xs font-semibold">Active</div>
              </div>
              <div className="bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg p-3 text-white text-center">
                <div className="text-xl font-bold">🎯</div>
                <div className="text-xs font-semibold">Ready</div>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/match/create"
                className="game-button w-full text-lg font-bold rounded-xl py-4 flex items-center justify-center space-x-2"
              >
                <span>🚀</span>
                <span>Create New Match</span>
              </Link>
              <Link
                href="/match/browse"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg font-bold rounded-xl py-4 transition-all duration-300 hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <span>�</span>
                <span>Browse All Matches</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Join Matches */}
        <div className="space-y-4">
          <div className="game-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                <span className="dice-icon text-2xl">⚡</span>
                <span>Quick Join</span>
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchMatches(true)}
                  disabled={matchesLoading}
                  className="p-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                  title="Refresh matches"
                >
                  <svg className={`w-4 h-4 ${matchesLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                {matches.length > 0 && (
                  <Link 
                    href="/match/browse"
                    className="text-sm bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold"
                  >
                    View All →
                  </Link>
                )}
              </div>
            </div>

            {matchesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white bg-opacity-50 rounded-xl p-4 loading-shimmer">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-24"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                      </div>
                      <div className="h-8 bg-gray-300 rounded-lg w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : matches.length > 0 ? (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div key={match.id} className="bg-white bg-opacity-80 rounded-xl p-4 border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">👤</span>
                          </div>
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {match.player1.name}
                          </p>
                          <span className="status-waiting">
                            {formatTimeAgo(match.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg font-semibold flex items-center space-x-1">
                            <span className="coin-icon">💰</span>
                            <span>₹{match.entryFee}</span>
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg font-semibold flex items-center space-x-1">
                            <span className="trophy-icon">🏆</span>
                            <span>₹{Math.floor(match.pot * 0.9)}</span>
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-mono font-semibold">
                            {match.roomCode}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinMatch(match.id)}
                        disabled={joiningMatch === match.id}
                        className="ml-3 game-button text-sm px-6 py-3 whitespace-nowrap"
                      >
                        {joiningMatch === match.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>⚡ Join</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white bg-opacity-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🎮</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No Active Matches</h3>
                <p className="text-sm text-gray-600 mb-4">Be the first champion to create a match!</p>
                <Link
                  href="/match/create"
                  className="inline-flex items-center text-sm bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold"
                >
                  🚀 Create Match →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access Menu */}
        <div className="game-card p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span className="dice-icon text-2xl">🎯</span>
            <span>Game Center</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/match/history"
              className="flex items-center space-x-3 p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl hover:from-purple-200 hover:to-purple-300 transition-all duration-300 hover:shadow-lg"
            >
              <span className="text-2xl">📊</span>
              <div>
                <div className="text-sm font-bold text-purple-800">Match History</div>
                <div className="text-xs text-purple-600">View past games</div>
              </div>
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center space-x-3 p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl hover:from-yellow-200 hover:to-yellow-300 transition-all duration-300 hover:shadow-lg"
            >
              <span className="text-2xl trophy-icon">🏆</span>
              <div>
                <div className="text-sm font-bold text-yellow-800">Leaderboard</div>
                <div className="text-xs text-yellow-600">Top players</div>
              </div>
            </Link>
            <Link
              href="/referrals"
              className="flex items-center space-x-3 p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl hover:from-green-200 hover:to-green-300 transition-all duration-300 hover:shadow-lg"
            >
              <span className="text-2xl">🎁</span>
              <div>
                <div className="text-sm font-bold text-green-800">Invite Friends</div>
                <div className="text-xs text-green-600">Earn rewards</div>
              </div>
            </Link>
            {user.isAdmin && (
              <Link
                href="/admin"
                className="flex items-center space-x-3 p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-xl hover:from-red-200 hover:to-red-300 transition-all duration-300 hover:shadow-lg"
              >
                <span className="text-2xl">👑</span>
                <div>
                  <div className="text-sm font-bold text-red-800">Admin Panel</div>
                  <div className="text-xs text-red-600">Manage games</div>
                </div>
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
