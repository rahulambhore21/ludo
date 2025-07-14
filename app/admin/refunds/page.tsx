'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface User {
  _id: string;
  name: string;
  phone: string;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminRefunds() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundType, setRefundType] = useState<'add' | 'deduct'>('add');
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedUser || !refundAmount || !refundReason) {
      setError('Please fill all fields');
      return;
    }

    const amount = parseFloat(refundAmount);
    if (amount <= 0) {
      setError('Amount must be positive');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          amount,
          type: refundType,
          reason: refundReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund');
      }

      // Refresh users list
      await fetchUsers();
      
      // Close modal and reset form
      setShowRefundModal(false);
      setSelectedUser(null);
      setRefundAmount('');
      setRefundReason('');
      setError('');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  const openRefundModal = (user: User, type: 'add' | 'deduct') => {
    setSelectedUser(user);
    setRefundType(type);
    setShowRefundModal(true);
    setError('');
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <AdminLayout title="Manual Refunds & Credits">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manual Refunds & Credits">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">User Management</h3>
            <div className="text-sm text-gray-600">
              Total Users: {users.length}
            </div>
          </div>
          <input
            type="text"
            placeholder="Search users by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {user._id.slice(-8)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{user.balance}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openRefundModal(user, 'add')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Add Coins
                        </button>
                        <button
                          onClick={() => openRefundModal(user, 'deduct')}
                          className="text-red-600 hover:text-red-900"
                          disabled={user.balance <= 0}
                        >
                          Deduct Coins
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Refund Modal */}
        {showRefundModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {refundType === 'add' ? 'Add Coins' : 'Deduct Coins'}
                  </h3>
                  <button
                    onClick={() => setShowRefundModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p><strong>User:</strong> {selectedUser.name}</p>
                    <p><strong>Phone:</strong> {selectedUser.phone}</p>
                    <p><strong>Current Balance:</strong> ₹{selectedUser.balance}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter reason for this transaction"
                    />
                  </div>

                  {refundType === 'deduct' && selectedUser.balance < parseFloat(refundAmount || '0') && (
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-red-600 text-sm">
                        Warning: User doesn't have sufficient balance for this deduction.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowRefundModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRefund}
                      disabled={processing || !refundAmount || !refundReason}
                      className={`px-4 py-2 rounded-md text-white ${
                        refundType === 'add'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      } disabled:opacity-50`}
                    >
                      {processing ? 'Processing...' : (refundType === 'add' ? 'Add Coins' : 'Deduct Coins')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
