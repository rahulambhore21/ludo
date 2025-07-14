'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useNotifications } from '../../../contexts/NotificationContext';

interface CancelRequest {
  _id: string;
  matchId: {
    _id: string;
    entryFee: number;
    pot: number;
    roomCode: string;
    status: string;
    createdAt: string;
  };
  requestedBy: {
    _id: string;
    name: string;
    phone: string;
  };
  reason: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: {
    _id: string;
    name: string;
    phone: string;
  };
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCancelRequests() {
  const [cancelRequests, setCancelRequests] = useState<CancelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CancelRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const { showToast } = useNotifications();

  useEffect(() => {
    fetchCancelRequests();
  }, []);

  const fetchCancelRequests = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/admin/cancel-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cancel requests');
      }

      const data = await response.json();
      setCancelRequests(data.cancelRequests);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cancel requests';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!reviewNote.trim() && action === 'reject') {
      showToast('error', 'Please provide a reason for rejection');
      return;
    }

    setProcessingId(requestId);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/admin/cancel-requests/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          note: reviewNote.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} cancel request`);
      }

      showToast('success', `Cancel request ${action}d successfully`);
      
      // Refresh the list
      await fetchCancelRequests();
      
      // Close modal
      setSelectedRequest(null);
      setReviewNote('');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} cancel request`;
      showToast('error', errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: { [key: string]: string } = {
      'opponent_not_responding': 'Opponent not responding',
      'technical_issues': 'Technical issues',
      'game_crashed': 'Game crashed',
      'unfair_play': 'Unfair play',
      'personal_emergency': 'Personal emergency',
      'other': 'Other reason',
    };
    return labels[reason] || reason;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = cancelRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  if (loading) {
    return (
      <AdminLayout title="Cancel Requests">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Cancel Requests">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={fetchCancelRequests}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Cancel Requests">
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold text-gray-900">Cancel Requests</h1>
          
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Requests</div>
            <div className="text-2xl font-bold text-gray-900">{cancelRequests.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {cancelRequests.filter(r => r.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Approved</div>
            <div className="text-2xl font-bold text-green-600">
              {cancelRequests.filter(r => r.status === 'approved').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Rejected</div>
            <div className="text-2xl font-bold text-red-600">
              {cancelRequests.filter(r => r.status === 'rejected').length}
            </div>
          </div>
        </div>

        {/* Cancel Requests Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">
                {filter === 'all' ? 'No cancel requests found' : `No ${filter} requests found`}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Room: {request.matchId.roomCode}
                        </div>
                        <div className="text-sm text-gray-500">
                          Entry: ₹{request.matchId.entryFee} | Pot: ₹{request.matchId.pot}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.requestedBy.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.requestedBy.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getReasonLabel(request.reason)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Cancel Request Details
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setReviewNote('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Request Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Match Room</label>
                      <div className="text-sm text-gray-900">{selectedRequest.matchId.roomCode}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Entry Fee</label>
                      <div className="text-sm text-gray-900">₹{selectedRequest.matchId.entryFee}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Requested By</label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.requestedBy.name} ({selectedRequest.requestedBy.phone})
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reason</label>
                      <div className="text-sm text-gray-900">{getReasonLabel(selectedRequest.reason)}</div>
                    </div>
                  </div>

                  {/* Screenshot */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Screenshot Proof</label>
                    <img
                      src={selectedRequest.screenshotUrl}
                      alt="Cancel request proof"
                      className="max-w-full h-auto rounded-md border"
                    />
                  </div>

                  {/* Review Note */}
                  {selectedRequest.status === 'pending' && (
                    <div>
                      <label htmlFor="reviewNote" className="block text-sm font-medium text-gray-700 mb-2">
                        Review Note (required for rejection)
                      </label>
                      <textarea
                        id="reviewNote"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add a note about your decision..."
                      />
                    </div>
                  )}

                  {/* Previous Review */}
                  {selectedRequest.status !== 'pending' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Review Details</label>
                      <div className="text-sm text-gray-900">
                        Status: <span className={`font-medium ${selectedRequest.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                        </span>
                      </div>
                      {selectedRequest.reviewedBy && (
                        <div className="text-sm text-gray-500">
                          Reviewed by: {selectedRequest.reviewedBy.name}
                        </div>
                      )}
                      {selectedRequest.reviewNote && (
                        <div className="text-sm text-gray-900 mt-1">
                          Note: {selectedRequest.reviewNote}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedRequest.status === 'pending' && (
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={() => handleReviewRequest(selectedRequest._id, 'reject')}
                        disabled={processingId === selectedRequest._id}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {processingId === selectedRequest._id ? 'Processing...' : 'Reject'}
                      </button>
                      <button
                        onClick={() => handleReviewRequest(selectedRequest._id, 'approve')}
                        disabled={processingId === selectedRequest._id}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {processingId === selectedRequest._id ? 'Processing...' : 'Approve & Refund'}
                      </button>
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
