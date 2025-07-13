'use client';

import React, { useState } from 'react';

interface CancelGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, screenshot: File) => Promise<void>;
  loading: boolean;
}

const CANCEL_REASONS = [
  { value: 'opponent-not-responding', label: 'Opponent not responding' },
  { value: 'technical-issues', label: 'Technical issues with the game' },
  { value: 'wrong-match-joined', label: 'Joined wrong match by mistake' },
  { value: 'game-crashed', label: 'Game crashed or not working' },
  { value: 'emergency', label: 'Emergency situation' },
  { value: 'other', label: 'Other reason' },
];

export default function CancelGameModal({ isOpen, onClose, onSubmit, loading }: CancelGameModalProps) {
  const [reason, setReason] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
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
    setError('');

    if (!reason) {
      setError('Please select a reason for cancellation');
      return;
    }

    if (!screenshot) {
      setError('Please upload a screenshot as proof');
      return;
    }

    try {
      await onSubmit(reason, screenshot);
      // Reset form
      setReason('');
      setScreenshot(null);
      setPreviewUrl(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit cancel request');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setScreenshot(null);
      setPreviewUrl(null);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Cancel Game Request</h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
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
                {CANCEL_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Screenshot Upload */}
            <div>
              <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Screenshot Proof *
              </label>
              <input
                type="file"
                id="screenshot"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload a screenshot showing the issue (max 5MB)
              </p>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <img
                  src={previewUrl}
                  alt="Screenshot preview"
                  className="max-w-full h-32 object-contain border border-gray-300 rounded"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Cancel requests are reviewed by admins. False requests may result in penalties.
                Your entry fee will be refunded only if the cancellation is approved.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason || !screenshot}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
