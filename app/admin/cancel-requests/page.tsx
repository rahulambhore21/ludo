'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

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
  };
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

const REASON_LABELS: { [key: string]: string } = {
  'opponent-not-responding': 'Opponent not responding',
  'technical-issues': 'Technical issues',
  'wrong-match-joined': 'Wrong match joined',
  'game-crashed': 'Game crashed',
  'emergency': 'Emergency',
  'other': 'Other reason',
};

export default function AdminCancelRequests() {
  const [cancelRequests, setCancelRequests] = useState<CancelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingRequest, setReviewingRequest] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CancelRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const router = useRouter();

  useEffect(() => {
    fetchCancelRequests();
  }, []);

  const fetchCancelRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/admin/cancel-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cancel requests');
      }

      setCancelRequests(data.cancelRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (request: CancelRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNote('');
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setSelectedRequest(null);
    setReviewNote('');
    setShowReviewModal(false);
  };

  const handleReview = async () => {
    if (!selectedRequest) return;

    setReviewingRequest(selectedRequest._id);

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/cancel-requests/${selectedRequest._id}/${reviewAction}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ note: reviewNote }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to review cancel request');
      }

      // Refresh the list
      await fetchCancelRequests();
      closeReviewModal();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review request');
    } finally {
      setReviewingRequest(null);
    }
  };

  const filteredRequests = cancelRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  if (loading) {
    return (
      <AdminLayout title="Cancel Requests">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Cancel Requests">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Cancel Requests</h1>
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={fetchCancelRequests}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">📝</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">{cancelRequests.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-yellow-600">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {cancelRequests.filter(r => r.status === 'pending').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {cancelRequests.filter(r => r.status === 'approved').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-red-600">❌</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {cancelRequests.filter(r => r.status === 'rejected').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Requests List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No cancel requests found.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <li key={request._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Match #{request.matchId._id.slice(-6)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Room: {request.matchId.roomCode} • Entry: ₹{request.matchId.entryFee}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {request.requestedBy.name}
                        </p>
                        <p className="text-sm text-gray-500">{request.requestedBy.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {REASON_LABELS[request.reason] || request.reason}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Screenshot Preview */}
                      <a
                        href={request.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Screenshot
                      </a>

                      {/* Status Badge */}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>

                      {/* Action Buttons */}
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openReviewModal(request, 'approve')}
                            disabled={reviewingRequest === request._id}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openReviewModal(request, 'reject')}
                            disabled={reviewingRequest === request._id}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {request.status !== 'pending' && request.reviewNote && (
                        <div className="text-xs text-gray-500 max-w-xs">
                          Note: {request.reviewNote}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {reviewAction === 'approve' ? 'Approve' : 'Reject'} Cancel Request
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Match:</strong> #{selectedRequest.matchId._id.slice(-6)} 
                    (Room: {selectedRequest.matchId.roomCode})
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>User:</strong> {selectedRequest.requestedBy.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Reason:</strong> {REASON_LABELS[selectedRequest.reason] || selectedRequest.reason}
                  </p>
                </div>

                <div className="mb-4">
                  <label htmlFor="reviewNote" className="block text-sm font-medium text-gray-700 mb-2">
                    Review Note (Optional)
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

                {reviewAction === 'approve' && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      ⚠️ Approving will cancel the match and refund entry fees to both players.
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={closeReviewModal}
                    disabled={reviewingRequest === selectedRequest._id}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReview}
                    disabled={reviewingRequest === selectedRequest._id}
                    className={`flex-1 px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                      reviewAction === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {reviewingRequest === selectedRequest._id ? 'Processing...' : 
                     reviewAction === 'approve' ? 'Approve Request' : 'Reject Request'}
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
