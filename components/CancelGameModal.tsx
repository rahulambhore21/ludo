'use client';

import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

interface CancelGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  onSuccess: () => void;
}

const CANCEL_REASONS = [
  { value: 'opponent_not_responding', label: 'Opponent not responding' },
  { value: 'technical_issues', label: 'Technical issues with the game' },
  { value: 'game_crashed', label: 'Game crashed or froze' },
  { value: 'unfair_play', label: 'Opponent playing unfairly' },
  { value: 'personal_emergency', label: 'Personal emergency' },
  { value: 'other', label: 'Other reason' },
];

export default function CancelGameModal({ isOpen, onClose, matchId, onSuccess }: CancelGameModalProps) {
  const [reason, setReason] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useNotifications();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setScreenshot(file);
      setError('');

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      setError('Please select a reason for cancellation');
      return;
    }

    if (!screenshot) {
      setError('Please upload a screenshot as proof');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('matchId', matchId);
      formData.append('reason', reason);
      formData.append('screenshot', screenshot);

      const response = await fetch('/api/match/cancel-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit cancel request');
      }

      showToast('success', 'Cancel request submitted successfully. Admin will review it.');
      onSuccess();
      onClose();
      
      // Reset form
      setReason('');
      setScreenshot(null);
      setPreviewUrl(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit cancel request';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setReason('');
      setScreenshot(null);
      setPreviewUrl(null);
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Cancel Game Request
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reason Selection */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation *
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a reason</option>
                {CANCEL_REASONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Screenshot Upload */}
            <div>
              <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700 mb-2">
                Screenshot Proof *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {previewUrl ? (
                    <div className="mb-4">
                      <img
                        src={previewUrl}
                        alt="Screenshot preview"
                        className="mx-auto h-32 w-auto rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshot(null);
                          setPreviewUrl(null);
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="screenshot" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload a screenshot</span>
                          <input
                            id="screenshot"
                            name="screenshot"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleFileChange}
                            required
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Info Message */}
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Your cancel request will be reviewed by an admin. 
                Please provide a clear screenshot showing the issue you're facing.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason || !screenshot}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
