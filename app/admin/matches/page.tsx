'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface Match {
  _id: string;
  player1: {
    _id: string;
    name: string;
    phone: string;
  };
  player2: {
    _id: string;
    name: string;
    phone: string;
  };
  entryFee: number;
  pot: number;
  platformCut: number;
  roomCode: string;
  player1Result?: 'win' | 'loss';
  player2Result?: 'win' | 'loss';
  status: 'waiting' | 'active' | 'completed' | 'conflict';
  createdAt: string;
  updatedAt: string;
}

export default function AdminMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingMatch, setResolvingMatch] = useState<string | null>(null);

  useEffect(() => {
    fetchConflictMatches();
  }, []);

  const fetchConflictMatches = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/matches/conflicts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conflict matches');
      }

      setMatches(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveMatch = async (
    matchId: string,
    action: 'player1-wins' | 'player2-wins' | 'reject-both'
  ) => {
    setResolvingMatch(matchId);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/matches/${matchId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve match');
      }

      // Refresh matches
      await fetchConflictMatches();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setResolvingMatch(null);
    }
  };

  const getConflictDescription = (match: Match) => {
    if (match.player1Result === 'win' && match.player2Result === 'win') {
      return 'Both players claim they won';
    }
    if (match.player1Result === 'loss' && match.player2Result === 'loss') {
      return 'Both players claim they lost';
    }
    if (!match.player1Result || !match.player2Result) {
      return 'Missing result from one player';
    }
    return 'Result conflict';
  };

  return (
    <AdminLayout title="Match Conflicts">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Conflicts Requiring Resolution
            </h3>
            <p className="text-sm text-gray-500">
              Matches where players have conflicting results
            </p>
          </div>
          <button
            onClick={fetchConflictMatches}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Conflict Matches */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="text-gray-600">Loading conflict matches...</div>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="text-gray-500">
            🎉 No conflicts to resolve! All matches are running smoothly.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => (
            <div key={match._id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-red-800">
                    ⚔️ Match Conflict
                  </h3>
                  <span className="text-sm text-red-600">
                    {getConflictDescription(match)}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {/* Match Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Match Details
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Room Code:</span>
                        <span className="ml-2 font-mono font-bold">{match.roomCode}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Entry Fee:</span>
                        <span className="ml-2 font-bold">{match.entryFee} coins</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total Pot:</span>
                        <span className="ml-2 font-bold text-green-600">{match.pot} coins</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Winner Gets:</span>
                        <span className="ml-2 font-bold text-green-600">
                          {match.pot - match.platformCut} coins
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Platform Cut:</span>
                        <span className="ml-2 font-bold text-purple-600">
                          {match.platformCut} coins
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Created
                    </h4>
                    <div className="text-sm text-gray-600">
                      {new Date(match.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                {/* Players and Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Player 1 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {match.player1.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">{match.player1.name}</h5>
                        <p className="text-sm text-gray-500">{match.player1.phone}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Reported Result:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                        match.player1Result === 'win' 
                          ? 'bg-green-100 text-green-800'
                          : match.player1Result === 'loss'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {match.player1Result ? 
                          (match.player1Result === 'win' ? '🏆 Won' : '💔 Lost') 
                          : '⏳ No response'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Player 2 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {match.player2.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">{match.player2.name}</h5>
                        <p className="text-sm text-gray-500">{match.player2.phone}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Reported Result:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                        match.player2Result === 'win' 
                          ? 'bg-green-100 text-green-800'
                          : match.player2Result === 'loss'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {match.player2Result ? 
                          (match.player2Result === 'win' ? '🏆 Won' : '💔 Lost') 
                          : '⏳ No response'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resolution Actions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Administrative Resolution
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleResolveMatch(match._id, 'player1-wins')}
                      disabled={resolvingMatch === match._id}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                    >
                      {resolvingMatch === match._id ? 'Processing...' : `${match.player1.name} Wins`}
                    </button>
                    <button
                      onClick={() => handleResolveMatch(match._id, 'player2-wins')}
                      disabled={resolvingMatch === match._id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                    >
                      {resolvingMatch === match._id ? 'Processing...' : `${match.player2.name} Wins`}
                    </button>
                    <button
                      onClick={() => handleResolveMatch(match._id, 'reject-both')}
                      disabled={resolvingMatch === match._id}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                    >
                      {resolvingMatch === match._id ? 'Processing...' : 'Reject Both (Refund)'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ This action cannot be undone. Choose carefully based on evidence.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
