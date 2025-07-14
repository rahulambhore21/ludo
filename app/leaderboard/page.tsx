'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LeaderboardEntry {
  _id: string;
  name: string;
  phone: string;
  balance: number;
  totalMatches: number;
  wonMatches: number;
  winRate: number;
  rank: number;
}

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  balance: number;
}

export default function LeaderboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      fetchLeaderboard();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/leaderboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }

      setLeaderboard(data.leaderboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserRank = () => {
    return leaderboard.find(entry => entry._id === user?.id)?.rank || 'N/A';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600'; // Gold
    if (rank === 2) return 'text-gray-500'; // Silver
    if (rank === 3) return 'text-orange-600'; // Bronze
    return 'text-gray-700';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Floating decorative elements */}
      <div className="fixed top-10 left-10 float-animation opacity-20">
        <div className="text-6xl">🏆</div>
      </div>
      <div className="fixed top-20 right-20 float-animation opacity-20" style={{animationDelay: '1s'}}>
        <div className="text-5xl">👑</div>
      </div>
      <div className="fixed bottom-20 right-20 float-animation opacity-20" style={{animationDelay: '2s'}}>
        <div className="text-4xl">⭐</div>
      </div>

      {/* Header */}
      <div className="game-card m-4 p-6 text-center">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/dashboard"
            className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span className="trophy-icon text-3xl">🏆</span>
            <span>Champions League</span>
          </h1>
          <div className="w-10"></div>
        </div>
        
        <p className="text-purple-600 font-semibold">
          🎮 Top Players • 🚀 Rising Stars • 💎 Elite Champions
        </p>
      </div>

      {/* User's Current Rank Card */}
      <div className="mx-4 mb-6">
        <div className="game-card p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <h2 className="text-lg font-bold mb-3 flex items-center space-x-2">
            <span>🎯</span>
            <span>Your Championship Status</span>
          </h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{getCurrentUserRank()}</div>
              <div className="text-sm opacity-90">Rank</div>
            </div>
            <div>
              <div className="text-2xl font-bold flex items-center justify-center">
                <span className="coin-icon">💰</span>
                <span>₹{user.balance}</span>
              </div>
              <div className="text-sm opacity-90">Balance</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {leaderboard.find(entry => entry._id === user.id)?.totalMatches || 0}
              </div>
              <div className="text-sm opacity-90">Matches</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {leaderboard.find(entry => entry._id === user.id)?.winRate || 0}%
              </div>
              <div className="text-sm opacity-90">Win Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mx-4 pb-6">
        <div className="game-card p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span className="trophy-icon text-2xl">🏅</span>
            <span>Top Champions</span>
          </h2>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="loading-shimmer h-16 rounded-lg"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">😓</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="game-button px-6 py-2"
              >
                🔄 Try Again
              </button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No Champions Yet!</h3>
              <p className="text-gray-600 mb-4">Be the first to start playing and claim the top spot!</p>
              <Link
                href="/match/create"
                className="game-button px-6 py-2 inline-block"
              >
                🚀 Start Playing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry._id}
                  className={`relative rounded-xl p-4 transition-all duration-300 hover:shadow-lg ${
                    entry._id === user.id
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-400 pulse-glow'
                      : 'bg-white bg-opacity-80 border border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="absolute -top-2 -left-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      entry.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      entry.rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                      entry.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}>
                      {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                    </div>
                  </div>

                  <div className="flex items-center justify-between ml-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {entry.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className={`font-bold ${entry._id === user.id ? 'text-purple-800' : 'text-gray-800'}`}>
                          {entry.name}
                          {entry._id === user.id && (
                            <span className="ml-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                              You 🎯
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {entry.totalMatches} matches • {entry.wonMatches} wins
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="coin-icon text-lg">💰</span>
                        <span className="font-bold text-gray-800">₹{entry.balance}</span>
                      </div>
                      <div className={`text-sm font-semibold ${
                        entry.winRate >= 80 ? 'text-green-600' :
                        entry.winRate >= 60 ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {entry.winRate.toFixed(1)}% win rate
                        {entry.winRate >= 80 && <span className="ml-1">🔥</span>}
                      </div>
                    </div>
                  </div>

                  {/* Achievement Badges */}
                  <div className="mt-3 flex items-center space-x-2">
                    {entry.rank === 1 && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">
                        👑 Champion
                      </span>
                    )}
                    {entry.winRate >= 80 && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">
                        🔥 Hot Streak
                      </span>
                    )}
                    {entry.totalMatches >= 50 && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                        ⚡ Veteran
                      </span>
                    )}
                    {entry.balance >= 1000 && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                        💎 Elite
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mx-4 pb-8">
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/match/create"
            className="game-button text-center py-3 flex items-center justify-center space-x-2"
          >
            <span>🚀</span>
            <span>Challenge Players</span>
          </Link>
          <Link
            href="/dashboard"
            className="bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white font-bold rounded-xl py-3 text-center transition-all duration-300 hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <span>🏠</span>
            <span>Back to Arena</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
