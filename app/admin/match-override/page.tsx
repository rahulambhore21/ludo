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
  player2?: {
    _id: string;
    name: string;
    phone: string;
  };
  amount: number;
  status: string;
  winner?: string;
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function MatchOverride() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [newWinner, setNewWinner] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/disputed-matches', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!selectedMatch || !newWinner || !overrideReason.trim()) {
      setError('Please select a winner and provide a reason for override');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/override-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: selectedMatch._id,
          winnerId: newWinner,
          reason: overrideReason,
        }),
      });

      if (response.ok) {
        setSuccess('Match result overridden successfully');
        await fetchMatches();
        setSelectedMatch(null);
        setOverrideReason('');
        setNewWinner('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to override match');
      }
    } catch (err) {
      console.error('Error overriding match:', err);
      setError('Failed to override match');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Match Override">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Match Override">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-black">Match Override</h1>
          <p className="text-gray-600 mt-1">
            Manually override match results for dispute resolution
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Disputed Matches */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Disputed/Pending Matches</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Players
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {matches.map((match) => (
                  <tr key={match._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {match._id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <div>{match.player1.name} ({match.player1.phone})</div>
                        {match.player2 && (
                          <div className="text-gray-500">vs {match.player2.name} ({match.player2.phone})</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      ₹{match.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        match.status === 'disputed' ? 'bg-red-100 text-red-800' :
                        match.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(match.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedMatch(match)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
                {matches.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No disputed matches found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Override Modal */}
        {selectedMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Override Match Result
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Match Details
                  </label>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Match ID:</strong> {selectedMatch._id.slice(-8)}</p>
                    <p><strong>Amount:</strong> ₹{selectedMatch.amount}</p>
                    <p><strong>Players:</strong></p>
                    <ul className="ml-4">
                      <li>• {selectedMatch.player1.name} ({selectedMatch.player1.phone})</li>
                      {selectedMatch.player2 && (
                        <li>• {selectedMatch.player2.name} ({selectedMatch.player2.phone})</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Winner
                  </label>
                  <select
                    value={newWinner}
                    onChange={(e) => setNewWinner(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select winner</option>
                    <option value={selectedMatch.player1._id}>
                      {selectedMatch.player1.name}
                    </option>
                    {selectedMatch.player2 && (
                      <option value={selectedMatch.player2._id}>
                        {selectedMatch.player2.name}
                      </option>
                    )}
                    <option value="draw">Declare Draw (refund both)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Override Reason
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Provide detailed reason for override..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleOverride}
                    disabled={processing}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Override Match'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMatch(null);
                      setOverrideReason('');
                      setNewWinner('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
