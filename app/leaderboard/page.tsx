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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">🏆 Leaderboard</h1>
            </div>
            <div className="text-sm text-gray-600">
              Your Rank: <span className="font-semibold">#{getCurrentUserRank()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Current User Stats */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
          <h2 className="text-xl font-bold mb-4">Your Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{getCurrentUserRank()}</div>
              <div className="text-sm opacity-80">Current Rank</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{user.balance}</div>
              <div className="text-sm opacity-80">Coins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {leaderboard.find(entry => entry._id === user.id)?.totalMatches || 0}
              </div>
              <div className="text-sm opacity-80">Matches Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {leaderboard.find(entry => entry._id === user.id)?.winRate || 0}%
              </div>
              <div className="text-sm opacity-80">Win Rate</div>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Players</h3>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-600">Loading leaderboard...</div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600">{error}</div>
              <button 
                onClick={fetchLeaderboard}
                className="mt-2 text-indigo-600 hover:text-indigo-800"
              >
                Try Again
              </button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-600">No players found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matches
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Win Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coins
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry) => (
                    <tr 
                      key={entry._id}
                      className={`${entry._id === user.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center text-sm font-medium ${getRankColor(entry.rank)}`}>
                          <span className="mr-2">{getRankIcon(entry.rank)}</span>
                          #{entry.rank}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                              {entry.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.name}
                              {entry._id === user.id && (
                                <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{entry.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.totalMatches}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.wonMatches}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">{entry.winRate}%</div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{width: `${Math.min(entry.winRate, 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium">{entry.balance}</span> coins
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-4">
          <Link 
            href="/match/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Create Match
          </Link>
          <Link 
            href="/match/browse"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Join Match
          </Link>
          <Link 
            href="/match/history"
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            View History
          </Link>
        </div>
      </main>
    </div>
  );
}
