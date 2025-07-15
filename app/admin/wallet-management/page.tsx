'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';

interface User {
  _id: string;
  name: string;
  phone: string;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
}

interface WalletAction {
  _id: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
  };
  adminId: {
    _id: string;
    name: string;
    phone: string;
  };
  type: 'manual_add' | 'manual_deduct';
  amount: number;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export default function AdminWalletManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [walletActions, setWalletActions] = useState<WalletAction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchWalletActions();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletActions = async () => {
    setActionsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/wallet-actions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletActions(data.actions);
      }
    } catch (err) {
      console.error('Error fetching wallet actions:', err);
    } finally {
      setActionsLoading(false);
    }
  };

  const handleWalletAction = async () => {
    if (!selectedUser || !amount || !reason) {
      setError('Please fill all fields');
      return;
    }

    const actionAmount = parseFloat(amount);
    if (actionAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (actionType === 'deduct' && actionAmount > selectedUser.balance) {
      setError('Cannot deduct more than current balance');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/wallet-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          type: actionType,
          amount: actionAmount,
          reason,
        }),
      });

      if (response.ok) {
        setSuccess(`Successfully ${actionType === 'add' ? 'added' : 'deducted'} ₹${actionAmount} ${actionType === 'add' ? 'to' : 'from'} ${selectedUser.name}'s wallet`);
        setAmount('');
        setReason('');
        setSelectedUser(null);
        fetchUsers(); // Refresh user data
        fetchWalletActions(); // Refresh action history
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to perform wallet action');
      }
    } catch (err) {
      setError('Failed to perform wallet action');
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <AdminLayout title="Wallet Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Wallet Management">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-black">Manual Wallet Management</h1>
          <p className="text-gray-600 mt-1">
            Add or deduct coins from user wallets with proper logging
          </p>
        </div>

        {/* Action Form */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Perform Wallet Action</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Search and Select User
              </label>
              <input
                type="text"
                placeholder="Search by name or phone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                      selectedUser?._id === user._id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="font-medium text-black">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.phone}</div>
                    <div className="text-sm text-green-600">Balance: ₹{user.balance}</div>
                  </div>
                ))}
                {filteredUsers.length === 0 && searchTerm && (
                  <div className="p-3 text-gray-500 text-center">No users found</div>
                )}
              </div>
            </div>

            {/* Action Details */}
            <div>
              {selectedUser && (
                <div className="bg-blue-50 p-3 rounded-md mb-4">
                  <div className="font-medium text-blue-900">{selectedUser.name}</div>
                  <div className="text-sm text-blue-700">{selectedUser.phone}</div>
                  <div className="text-sm text-blue-700">Current Balance: ₹{selectedUser.balance}</div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Action Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as 'add' | 'deduct')}
                  >
                    <option value="add">Add Coins</option>
                    <option value="deduct">Deduct Coins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Reason
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for this action"
                  />
                </div>

                <button
                  onClick={handleWalletAction}
                  disabled={processing || !selectedUser || !amount || !reason}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : `${actionType === 'add' ? 'Add' : 'Deduct'} ₹${amount || '0'}`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action History */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-black">Recent Wallet Actions</h2>
            <button
              onClick={fetchWalletActions}
              disabled={actionsLoading}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              {actionsLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {walletActions.map((action) => (
                  <tr key={action._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(action.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{action.userId.name}</div>
                      <div className="text-sm text-gray-500">{action.userId.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        action.type === 'manual_add'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {action.type === 'manual_add' ? 'Added' : 'Deducted'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{action.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{action.balanceBefore} → ₹{action.balanceAfter}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {action.adminId.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {action.reason}
                    </td>
                  </tr>
                ))}
                {walletActions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No wallet actions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
