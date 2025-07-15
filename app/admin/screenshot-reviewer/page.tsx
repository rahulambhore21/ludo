'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface Screenshot {
  _id: string;
  matchId: string;
  playerId: string;
  playerName: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectReason?: string;
  matchAmount?: number;
}

export default function ScreenshotReviewer() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchScreenshots();
  }, []);

  const fetchScreenshots = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/screenshots', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setScreenshots(data.screenshots);
      }
    } catch (err) {
      console.error('Error fetching screenshots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (screenshotId: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessing(screenshotId);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/review-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          screenshotId,
          action,
          reason,
        }),
      });

      if (response.ok) {
        await fetchScreenshots(); // Refresh the list
      }
    } catch (err) {
      console.error('Error reviewing screenshot:', err);
    } finally {
      setProcessing(null);
    }
  };

  const filteredScreenshots = screenshots.filter(screenshot => {
    if (filter === 'all') return true;
    return screenshot.status === filter;
  });

  if (loading) {
    return (
      <AdminLayout title="Screenshot Reviewer">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Screenshot Reviewer">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-black">Screenshot Review</h1>
          <p className="text-gray-600 mt-1">
            Review and approve/reject match result screenshots
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <div className="flex space-x-4">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium capitalize ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status} ({screenshots.filter(s => status === 'all' || s.status === status).length})
              </button>
            ))}
          </div>
        </div>

        {/* Screenshots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScreenshots.map((screenshot) => (
            <div key={screenshot._id} className="bg-white text-black shadow rounded-lg p-4">
              <div className="mb-4">
                <img
                  src={screenshot.imageUrl}
                  alt="Match Screenshot"
                  className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(screenshot.imageUrl)}
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Player:</span>
                  <span className="font-medium">{screenshot.playerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Match Amount:</span>
                  <span className="font-medium">₹{screenshot.matchAmount || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uploaded:</span>
                  <span>{new Date(screenshot.uploadedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    screenshot.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                    screenshot.status === 'approved' ? 'bg-green-200 text-green-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {screenshot.status}
                  </span>
                </div>
              </div>

              {screenshot.status === 'pending' && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleReview(screenshot._id, 'approve')}
                    disabled={processing === screenshot._id}
                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    {processing === screenshot._id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) {
                        handleReview(screenshot._id, 'reject', reason);
                      }
                    }}
                    disabled={processing === screenshot._id}
                    className="flex-1 bg-red-600 text-white py-2 px-3 rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                  >
                    Reject
                  </button>
                </div>
              )}

              {screenshot.rejectReason && (
                <div className="mt-3 p-2 bg-red-50 rounded text-xs">
                  <span className="font-medium text-red-800">Rejected:</span>
                  <span className="text-red-600 ml-1">{screenshot.rejectReason}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredScreenshots.length === 0 && (
          <div className="bg-white text-black shadow rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No screenshots found</h3>
            <p className="text-gray-600">
              {filter === 'pending' ? 'No screenshots pending review' : `No ${filter} screenshots`}
            </p>
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="max-w-4xl max-h-full">
              <img
                src={selectedImage}
                alt="Enlarged Screenshot"
                className="max-w-full max-h-full object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
