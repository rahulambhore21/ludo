'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { refreshUserBalance } from '@/lib/userUtils';

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  balance: number;
}

export default function DepositPage() {
  const [user, setUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      
      setProofFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !proofFile) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('proof', proofFile);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit deposit');
      }

      setSuccess('Deposit request submitted successfully! It will be reviewed by admin.');
      setAmount('');
      setProofFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('proof') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh user balance
      refreshUserBalance();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Add Coins</h1>
            <Link 
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Current Balance */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Current Balance</h2>
          <p className="text-3xl font-bold text-green-600">{user.balance} Coins</p>
        </div>

        {/* Payment Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Payment Instructions</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-blue-800">UPI ID:</p>
              <p className="text-lg font-mono text-blue-900">ludo@paytm</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">QR Code:</p>
              <div className="bg-white p-4 rounded border-2 border-dashed border-blue-300 text-center">
                <p className="text-gray-500">QR Code Image</p>
                <p className="text-xs text-gray-400">(In production, add actual QR code)</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                <strong>Rate:</strong> ₹1 = 1 Coin
              </p>
            </div>
          </div>
        </div>

        {/* Deposit Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Deposit Request</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount (₹)
              </label>
              <input
                type="number"
                id="amount"
                min="1"
                step="1"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter amount in rupees"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                You will receive {amount || '0'} coins
              </p>
            </div>

            <div>
              <label htmlFor="proof" className="block text-sm font-medium text-gray-700">
                Payment Proof (Screenshot)
              </label>
              <input
                type="file"
                id="proof"
                accept="image/*"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                onChange={handleFileChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload screenshot of payment confirmation (Max: 5MB)
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !amount || !proofFile}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Deposit Request'}
            </button>
          </form>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-center space-x-4">
          <Link
            href="/wallet/withdraw"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Withdraw Coins
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/wallet/history"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Transaction History
          </Link>
        </div>
      </main>
    </div>
  );
}
