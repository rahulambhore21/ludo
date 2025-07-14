'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Image from 'next/image';

interface Match {
  _id: string;
  player1: {
    _id?: string;
    name: string;
    phone: string;
    balance?: number;
  };
  player2?: {
    _id?: string;
    name: string;
    phone: string;
    balance?: number;
  } | null;
  winner?: {
    _id?: string;
    name: string;
    phone: string;
  } | null;
  entryFee: number;
  pot: number;
  platformCut: number;
  roomCode: string;
  player1Result?: 'win' | 'loss';
  player2Result?: 'win' | 'loss';
  player1Screenshot?: string;
  player2Screenshot?: string;
  status: 'waiting' | 'active' | 'in-progress' | 'completed' | 'cancelled' | 'conflict';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface CancelRequest {
  _id: string;
  matchId: string;
  requestedBy: {
    _id: string;
    name: string;
    phone: string;
  };
  reason: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface MatchStats {
  totalMatches: number;
  totalRevenue: number;
  completedMatches: number;
  conflictMatches: number;
  activeMatches: number;
  waitingMatches: number;
  cancelledMatches: number;
}

interface MatchDetails {
  match: Match;
  cancelRequests: CancelRequest[];
}

export default function AdminMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<MatchDetails | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: statusFilter,
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/matches?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch matches');
      }

      setMatches(data.matches || []);
      setStats(data.stats);
      setTotalPages(data.pagination?.totalPages || 1);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchDetails = async (matchId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/matches/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch match details');
      }

      setSelectedMatch(data);
      setShowMatchModal(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch match details');
    }
  };

  const handleApproveCancel = async (matchId: string, reason: string = '') => {
    try {
      setActionLoading(`cancel-${matchId}`);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/matches/${matchId}/approve-cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve cancellation');
      }

      // Refresh matches and close modal
      await fetchMatches();
      setShowMatchModal(false);
      setSelectedMatch(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve cancellation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkWinner = async (matchId: string, winnerId: string, reason: string = '') => {
    try {
      setActionLoading(`winner-${matchId}`);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/matches/${matchId}/mark-winner`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winnerId, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark winner');
      }

      // Refresh matches and close modal
      await fetchMatches();
      setShowMatchModal(false);
      setSelectedMatch(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark winner');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'conflict': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && matches.length === 0) {
    return (
      <AdminLayout title="Match Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Match Management">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Total Matches</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalMatches}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Platform Revenue</h3>
              <p className="text-3xl font-bold text-green-600">₹{stats.totalRevenue}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Conflicts</h3>
              <p className="text-3xl font-bold text-red-600">{stats.conflictMatches}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Active Matches</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.activeMatches}</p>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search matches (player name, phone, room code)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="waiting">Waiting</option>
                <option value="active">Active</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="conflict">Conflict</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Matches Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match Details
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
                  <tr key={match._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Room: {match.roomCode}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {match._id.slice(-8)}
                        </div>
                        {match.winner && (
                          <div className="text-sm text-green-600">
                            Winner: {match.winner.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {match.player1.name} ({match.player1.phone})
                        </div>
                        {match.player2 ? (
                          <div className="text-sm text-gray-500">
                            {match.player2.name} ({match.player2.phone})
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">Waiting for player 2</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          Entry: ₹{match.entryFee}
                        </div>
                        <div className="text-sm text-gray-500">
                          Pot: ₹{match.pot}
                        </div>
                        <div className="text-sm text-green-600">
                          Platform: ₹{match.platformCut}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(match.status)}`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(match.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => fetchMatchDetails(match._id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View Details
                      </button>
                      {(match.status === 'conflict' || match.status === 'active' || match.status === 'in-progress') && (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleApproveCancel(match._id, 'Admin cancelled match')}
                            disabled={actionLoading === `cancel-${match._id}`}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {actionLoading === `cancel-${match._id}` ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Match Details Modal */}
        {showMatchModal && selectedMatch && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Match Details - {selectedMatch.match.roomCode}
                  </h3>
                  <button
                    onClick={() => setShowMatchModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Match Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Match Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedMatch.match.status)}`}>{selectedMatch.match.status}</span></p>
                        <p><strong>Entry Fee:</strong> ₹{selectedMatch.match.entryFee}</p>
                        <p><strong>Pot:</strong> ₹{selectedMatch.match.pot}</p>
                        <p><strong>Platform Cut:</strong> ₹{selectedMatch.match.platformCut}</p>
                      </div>
                      <div>
                        <p><strong>Created:</strong> {formatDateTime(selectedMatch.match.createdAt)}</p>
                        {selectedMatch.match.completedAt && (
                          <p><strong>Completed:</strong> {formatDateTime(selectedMatch.match.completedAt)}</p>
                        )}
                        <p><strong>Room Code:</strong> {selectedMatch.match.roomCode}</p>
                      </div>
                    </div>
                  </div>

                  {/* Players Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Players</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border-r border-gray-200 pr-4">
                        <h5 className="font-medium text-blue-600">Player 1</h5>
                        <p><strong>Name:</strong> {selectedMatch.match.player1.name}</p>
                        <p><strong>Phone:</strong> {selectedMatch.match.player1.phone}</p>
                        {selectedMatch.match.player1.balance !== undefined && (
                          <p><strong>Balance:</strong> ₹{selectedMatch.match.player1.balance}</p>
                        )}
                        <p><strong>Result:</strong> {selectedMatch.match.player1Result || 'Pending'}</p>
                        {selectedMatch.match.player1Screenshot && (
                          <div className="mt-2">
                            <p><strong>Screenshot:</strong></p>
                            <Image
                              src={selectedMatch.match.player1Screenshot}
                              alt="Player 1 Screenshot"
                              width={150}
                              height={150}
                              className="rounded border"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <h5 className="font-medium text-green-600">Player 2</h5>
                        {selectedMatch.match.player2 ? (
                          <>
                            <p><strong>Name:</strong> {selectedMatch.match.player2.name}</p>
                            <p><strong>Phone:</strong> {selectedMatch.match.player2.phone}</p>
                            {selectedMatch.match.player2.balance !== undefined && (
                              <p><strong>Balance:</strong> ₹{selectedMatch.match.player2.balance}</p>
                            )}
                            <p><strong>Result:</strong> {selectedMatch.match.player2Result || 'Pending'}</p>
                            {selectedMatch.match.player2Screenshot && (
                              <div className="mt-2">
                                <p><strong>Screenshot:</strong></p>
                                <Image
                                  src={selectedMatch.match.player2Screenshot}
                                  alt="Player 2 Screenshot"
                                  width={150}
                                  height={150}
                                  className="rounded border"
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500">No player 2 joined yet</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cancel Requests */}
                  {selectedMatch.cancelRequests.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Cancel Requests</h4>
                      <div className="space-y-3">
                        {selectedMatch.cancelRequests.map((request) => (
                          <div key={request._id} className="border border-gray-200 p-3 rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <p><strong>Requested by:</strong> {request.requestedBy.name} ({request.requestedBy.phone})</p>
                                <p><strong>Reason:</strong> {request.reason}</p>
                                <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-sm ${getStatusColor(request.status)}`}>{request.status}</span></p>
                                <p><strong>Requested:</strong> {formatDateTime(request.createdAt)}</p>
                              </div>
                              {request.screenshotUrl && (
                                <div>
                                  <Image
                                    src={request.screenshotUrl}
                                    alt="Cancel Request Screenshot"
                                    width={100}
                                    height={100}
                                    className="rounded border"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Actions */}
                  {(selectedMatch.match.status === 'conflict' || selectedMatch.match.status === 'active' || selectedMatch.match.status === 'in-progress') && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Admin Actions</h4>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleApproveCancel(selectedMatch.match._id, 'Match cancelled by admin')}
                            disabled={actionLoading === `cancel-${selectedMatch.match._id}`}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            {actionLoading === `cancel-${selectedMatch.match._id}` ? 'Cancelling...' : 'Cancel Match & Refund'}
                          </button>
                          
                          {selectedMatch.match.player1 && (
                            <button
                              onClick={() => handleMarkWinner(selectedMatch.match._id, selectedMatch.match.player1._id!, `${selectedMatch.match.player1.name} marked as winner by admin`)}
                              disabled={actionLoading === `winner-${selectedMatch.match._id}`}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {actionLoading === `winner-${selectedMatch.match._id}` ? 'Processing...' : `Mark ${selectedMatch.match.player1.name} as Winner`}
                            </button>
                          )}
                          
                          {selectedMatch.match.player2 && (
                            <button
                              onClick={() => handleMarkWinner(selectedMatch.match._id, selectedMatch.match.player2!._id!, `${selectedMatch.match.player2!.name} marked as winner by admin`)}
                              disabled={actionLoading === `winner-${selectedMatch.match._id}`}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              {actionLoading === `winner-${selectedMatch.match._id}` ? 'Processing...' : `Mark ${selectedMatch.match.player2!.name} as Winner`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
