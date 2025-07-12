'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Match {
  _id: string;
  player1: {
    _id: string;
    name: string;
    phone: string;
  };
  player2?: {
    _id: string;
    name: string;
    phone: string;
  };
  entryFee: number;
  pot: number;
  roomCode: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  winner?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  completedAt?: string;
}

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  balance: number;
}

interface MatchStats {
  totalMatches: number;
  wonMatches: number;
  lostMatches: number;
  totalWinnings: number;
  totalLosses: number;
  netProfit: number;
}

export default function MatchHistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'active' | 'waiting'>('all');
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
      fetchMatchHistory();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchMatchHistory = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/match/user-history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch match history');
      }

      setMatches(data.matches);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  const getMatchResult = (match: Match) => {
    if (!user) return null;
    if (match.status !== 'completed' || !match.winner) return null;
    
    return match.winner._id === user.id ? 'won' : 'lost';
  };

  const getOpponentName = (match: Match) => {
    if (!user) return 'Unknown';
    
    if (match.player1._id === user.id) {
      return match.player2?.name || 'Waiting...';
    } else {
      return match.player1.name;
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
            <h1 className="text-2xl font-bold text-gray-900">Match History</h1>
            <Link 
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Matches</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMatches}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Won</h3>
              <p className="text-2xl font-bold text-green-600">{stats.wonMatches}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Lost</h3>
              <p className="text-2xl font-bold text-red-600">{stats.lostMatches}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Win Rate</h3>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalMatches > 0 ? Math.round((stats.wonMatches / stats.totalMatches) * 100) : 0}%
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Winnings</h3>
              <p className="text-2xl font-bold text-green-600">+{stats.totalWinnings}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Net Profit</h3>
              <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'completed' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'active' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('waiting')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'waiting' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Waiting
            </button>
          </div>
        </div>

        {/* Match History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Your Matches ({filteredMatches.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-600">Loading match history...</div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600">{error}</div>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">
                {filter === 'all' ? 'No matches found' : `No ${filter} matches found`}
              </div>
              {filter === 'all' && (
                <Link
                  href="/match/create"
                  className="mt-2 inline-block text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Create your first match
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMatches.map((match) => {
                const result = getMatchResult(match);
                const opponentName = getOpponentName(match);
                
                return (
                  <div key={match._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              result === 'won' ? 'bg-green-500' :
                              result === 'lost' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`}>
                              <span className="text-white font-medium text-sm">
                                {result === 'won' ? 'W' :
                                 result === 'lost' ? 'L' : 
                                 match.status === 'active' ? 'A' : 'W'}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900">
                              vs {opponentName}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Room: {match.roomCode}</span>
                              <span>Entry: {match.entryFee} coins</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                match.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                match.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                match.status === 'completed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {match.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {match.status === 'completed' && match.completedAt
                                ? `Completed: ${new Date(match.completedAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}`
                                : `Created: ${new Date(match.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          {result === 'won' && (
                            <div className="text-lg font-bold text-green-600">
                              +{match.pot - Math.floor(match.pot * 0.1)} coins
                            </div>
                          )}
                          {result === 'lost' && (
                            <div className="text-lg font-bold text-red-600">
                              -{match.entryFee} coins
                            </div>
                          )}
                          {!result && (
                            <div className="text-lg font-bold text-gray-500">
                              Pot: {match.pot} coins
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/match/${match._id}`}
                          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
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
            href="/match/browse"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Browse Matches
          </Link>
        </div>
      </main>
    </div>
  );
}
