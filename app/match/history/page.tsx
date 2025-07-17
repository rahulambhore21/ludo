'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWalletBalance } from '../../../lib/useWalletBalance';
import { useNotifications } from '../../../contexts/NotificationContext';

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
  status: 'waiting' | 'active' | 'in-progress' | 'completed' | 'cancelled' | 'conflict';
  winner?: {
    _id: string;
    name: string;
  };
  player1Result?: 'win' | 'loss';
  player2Result?: 'win' | 'loss';
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
  const { user, setUser, refreshBalance } = useWalletBalance();
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'active' | 'waiting' | 'conflict'>('all');
  const [submittingResult, setSubmittingResult] = useState<string | null>(null);
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

  const handleSubmitResult = async (matchId: string, result: 'win' | 'loss') => {
    if (!user) return;

    setSubmittingResult(matchId);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/match/submit-result/${matchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ result }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit result');
      }

      // Refresh match history to get updated status
      await fetchMatchHistory();

      // Update user balance if won
      if (result === 'win' && data.winnings) {
        // Refresh balance from server to ensure consistency
        await refreshBalance();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit result');
    } finally {
      setSubmittingResult(null);
    }
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    if (filter === 'active') return match.status === 'active' || match.status === 'in-progress';
    return match.status === filter;
  });

  const getMatchResult = (match: Match) => {
    if (!user) return null;
    if (match.status !== 'completed' || !match.winner) return null;
    
    return match.winner._id === user.id ? 'won' : 'lost';
  };

  const getOpponentName = (match: Match): string => {
    if (!user) return 'Unknown';
    
    if (match.player1._id === user.id) {
      return match.player2?.name || 'Waiting for player...';
    } else {
      return match.player1.name;
    }
  };

  const canSubmitResult = (match: Match): boolean => {
    if (!user) return false;
    if (match.status !== 'in-progress') return false;
    
    // Check if user is part of this match
    const isPlayer1 = match.player1._id === user.id;
    const isPlayer2 = match.player2?._id === user.id;
    
    if (!isPlayer1 && !isPlayer2) return false;
    
    // Check if user hasn't already submitted their result
    if (isPlayer1 && match.player1Result) return false;
    if (isPlayer2 && match.player2Result) return false;
    
    return true;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-yellow-400 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="dice-icon text-4xl">📜</div>
            </div>
          </div>
          <p className="mt-4 text-white font-semibold text-lg">Loading battle chronicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Floating decorative elements */}
      <div className="fixed top-10 left-10 float-animation opacity-20">
        <div className="text-6xl">📜</div>
      </div>
      <div className="fixed top-20 right-20 float-animation opacity-20" style={{animationDelay: '1s'}}>
        <div className="text-5xl">🏆</div>
      </div>
      <div className="fixed bottom-20 left-20 float-animation opacity-20" style={{animationDelay: '2s'}}>
        <div className="text-4xl">⚔️</div>
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
                <span className="text-white text-sm">📜</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Battle Chronicles</span>
            </div>

            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full px-3 py-1 text-sm font-bold flex items-center space-x-1">
              <span className="coin-icon">💰</span>
              <span>₹ {user.balance}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="game-card p-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="dice-icon text-3xl">📜</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Battle Chronicles</h1>
              <p className="text-purple-600 font-semibold">Your legendary victories and defeats! ⚔️</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="game-card p-4 text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <h3 className="text-sm font-bold opacity-90">Total Battles</h3>
              <p className="text-2xl font-bold">{stats.totalMatches}</p>
            </div>
            <div className="game-card p-4 text-center bg-gradient-to-br from-green-500 to-green-600 text-white">
              <h3 className="text-sm font-bold opacity-90">🏆 Victories</h3>
              <p className="text-2xl font-bold">{stats.wonMatches}</p>
            </div>
            <div className="game-card p-4 text-center bg-gradient-to-br from-red-500 to-red-600 text-white">
              <h3 className="text-sm font-bold opacity-90">💀 Defeats</h3>
              <p className="text-2xl font-bold">{stats.lostMatches}</p>
            </div>
            <div className="game-card p-4 text-center bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <h3 className="text-sm font-bold opacity-90">⚡ Win Rate</h3>
              <p className="text-2xl font-bold">
                {stats.totalMatches > 0 ? Math.round((stats.wonMatches / stats.totalMatches) * 100) : 0}%
              </p>
            </div>
            <div className="game-card p-4 text-center bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
              <h3 className="text-sm font-bold opacity-90">💰 Winnings</h3>
              <p className="text-2xl font-bold">+{stats.totalWinnings}</p>
            </div>
            <div className="game-card p-4 text-center bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <h3 className="text-sm font-bold opacity-90">📈 Net Profit</h3>
              <p className="text-2xl font-bold">
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
            <button
              onClick={() => setFilter('conflict')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'conflict' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚠️ Conflicts
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

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

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
                    {/* Instructions for active matches */}
                    {canSubmitResult(match) && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600 font-medium">🎮</span>
                          <span className="text-blue-800 text-sm">
                            Match is ready! Submit your result after playing with room code: <strong>{match.roomCode}</strong>
                          </span>
                        </div>
                      </div>
                    )}
                    
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
                                 (match.status === 'active' || match.status === 'in-progress') ? 'A' : 'W'}
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
                                (match.status === 'active' || match.status === 'in-progress') ? 'bg-blue-100 text-blue-800' :
                                match.status === 'completed' ? 'bg-green-100 text-green-800' :
                                match.status === 'conflict' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {match.status === 'conflict' ? '⚠️ CONFLICT' : 
                                 match.status === 'in-progress' ? 'ACTIVE' : 
                                 match.status.toUpperCase()}
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
                        
                        {/* Result Submission Buttons for Active Matches */}
                        {canSubmitResult(match) && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSubmitResult(match._id, 'win')}
                              disabled={submittingResult === match._id}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
                            >
                              {submittingResult === match._id ? 'Submitting...' : 'I Won'}
                            </button>
                            <button
                              onClick={() => handleSubmitResult(match._id, 'loss')}
                              disabled={submittingResult === match._id}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
                            >
                              {submittingResult === match._id ? 'Submitting...' : 'I Lost'}
                            </button>
                          </div>
                        )}
                        
                        <Link
                          href={`/match/${match._id}`}
                          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>

                    {/* Submit Result Button (for active matches) */}
                    {match.status === 'active' && (
                      <div className="mt-4">
                        <button
                          onClick={() => handleSubmitResult(match._id, 'win')}
                          disabled={submittingResult === match._id}
                          className={`px-4 py-2 rounded-md text-sm font-medium ${
                            submittingResult === match._id
                              ? 'bg-green-200 text-green-800 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-500'
                          }`}
                        >
                          {submittingResult === match._id ? 'Submitting...' : 'I Won'}
                        </button>
                        <button
                          onClick={() => handleSubmitResult(match._id, 'loss')}
                          disabled={submittingResult === match._id}
                          className={`ml-2 px-4 py-2 rounded-md text-sm font-medium ${
                            submittingResult === match._id
                              ? 'bg-red-200 text-red-800 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-500'
                          }`}
                        >
                          {submittingResult === match._id ? 'Submitting...' : 'I Lost'}
                        </button>
                      </div>
                    )}
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
          <span className="text-gray-300">|</span>
          <Link
            href="/leaderboard"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            🏆 Leaderboard
          </Link>
        </div>
      </main>
    </div>
  );
}
