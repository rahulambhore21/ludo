'use client';

import { useState, useEffect, use } from 'react';
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
  status: 'waiting' | 'active' | 'in-progress' | 'completed' | 'cancelled';
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

interface MatchPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MatchPage({ params }: MatchPageProps) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingResult, setSubmittingResult] = useState(false);
  const [resultSubmitted, setResultSubmitted] = useState(false);
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
      fetchMatch();
      
      // Poll for match updates every 3 seconds for real-time updates
      const pollInterval = setInterval(() => {
        fetchMatch();
      }, 3000);

      return () => clearInterval(pollInterval);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router, resolvedParams.id]);

  const fetchMatch = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/match/${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch match details');
      }

      setMatch(data.match);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResult = async (result: 'win' | 'loss') => {
    if (!match || !user) return;

    setSubmittingResult(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/match/submit-result/${resolvedParams.id}`, {
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

      setResultSubmitted(true);
      // Update match status
      setMatch(data.match);

      // Update user balance if won
      if (result === 'win' && data.winnings) {
        const updatedUser = { ...user, balance: user.balance + data.winnings };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmittingResult(false);
    }
  };

  const handleJoinMatch = async () => {
    if (!user || !match) return;

    if (user.balance < match.entryFee) {
      setError('Insufficient balance to join this match');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/match/join/${resolvedParams.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join match');
      }

      // Update user balance
      const updatedUser = { ...user, balance: user.balance - match.entryFee };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Update match
      setMatch(data.match);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading match details...</div>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Link
            href="/match/browse"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ← Back to Browse Matches
          </Link>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Match not found</div>
          <Link
            href="/match/browse"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ← Back to Browse Matches
          </Link>
        </div>
      </div>
    );
  }

  const isPlayer = match.player1._id === user.id || match.player2?._id === user.id;
  const canJoin = match.status === 'waiting' && !match.player2 && !isPlayer;
  const canSubmitResult = (match.status === 'active' || match.status === 'in-progress') && isPlayer && !resultSubmitted;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Match Details</h1>
            <Link 
              href="/match/browse"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              ← Back to Browse
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Match Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Match Status</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              match.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
              (match.status === 'active' || match.status === 'in-progress') ? 'bg-blue-100 text-blue-800' :
              match.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {match.status === 'in-progress' ? 'Active' : match.status.charAt(0).toUpperCase() + match.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Room Code</h3>
              <p className="mt-1 text-2xl font-bold text-gray-900">{match.roomCode}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Entry Fee</h3>
              <p className="mt-1 text-2xl font-bold text-gray-900">{match.entryFee} Coins</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Pot</h3>
              <p className="mt-1 text-2xl font-bold text-green-600">{match.pot} Coins</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Winner Gets</h3>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {match.pot - Math.floor(match.pot * 0.1)} Coins
              </p>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Players</h3>
          
          <div className="space-y-4">
            {/* Player 1 */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {match.player1.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-medium text-gray-900">{match.player1.name}</h4>
                <p className="text-sm text-gray-500">Player 1</p>
              </div>
              {match.winner?._id === match.player1._id && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Winner
                </span>
              )}
            </div>

            {/* Player 2 */}
            {match.player2 ? (
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {match.player2.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{match.player2.name}</h4>
                  <p className="text-sm text-gray-500">Player 2</p>
                </div>
                {match.winner?._id === match.player2._id && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Winner
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">?</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-500">Waiting for player...</h4>
                  <p className="text-sm text-gray-400">Player 2</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {canJoin && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Join Match</h3>
            <p className="text-gray-600 mb-4">
              You can join this match for {match.entryFee} coins. Your current balance: {user.balance} coins.
            </p>
            <button
              onClick={handleJoinMatch}
              disabled={user.balance < match.entryFee}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Match ({match.entryFee} coins)
            </button>
          </div>
        )}

        {canSubmitResult && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Result</h3>
            <p className="text-gray-600 mb-4">
              Have you completed the match? Please submit your result honestly.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleSubmitResult('win')}
                disabled={submittingResult}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {submittingResult ? 'Submitting...' : 'I Won'}
              </button>
              <button
                onClick={() => handleSubmitResult('loss')}
                disabled={submittingResult}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {submittingResult ? 'Submitting...' : 'I Lost'}
              </button>
            </div>
          </div>
        )}

        {match.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-green-800 mb-2">Match Completed</h3>
            <p className="text-green-700">
              Winner: <strong>{match.winner?.name}</strong>
            </p>
            <p className="text-sm text-green-600 mt-1">
              Completed on: {match.completedAt ? new Date(match.completedAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'Unknown'}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-800 mb-2">How to Play</h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>Open Ludo King app on your device</li>
            <li>Create or join a room using the room code: <strong>{match.roomCode}</strong></li>
            <li>Play the match with your opponent</li>
            <li>After completing the game, both players submit their results</li>
            <li>Winner receives {match.pot - Math.floor(match.pot * 0.1)} coins</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
