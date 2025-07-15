'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';

interface User {
  _id: string;
  name: string;
  phone: string;
  balance: number;
  isAdmin: boolean;
  isBanned: boolean;
  banReason?: string;
  bannedBy?: {
    name: string;
    phone: string;
  };
  bannedAt?: string;
  createdAt: string;
}

interface BanAction {
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
  action: 'ban' | 'unban';
  reason: string;
  createdAt: string;
}

export default function AdminUserBans() {
  const [users, setUsers] = useState<User[]>([]);
  const [banActions, setBanActions] = useState<BanAction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchBanActions();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/users-with-bans', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        console.log('Users received:', data.users?.length || 0);
        setUsers(data.users || []);
      } else {
        console.error('API Error:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setError(`Failed to load users: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchBanActions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/ban-actions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBanActions(data.actions);
      }
    } catch (err) {
      console.error('Error fetching ban actions:', err);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      setError('Please provide a reason for banning');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          action: 'ban',
          reason: banReason,
        }),
      });

      if (response.ok) {
        setSuccess(`Successfully banned ${selectedUser.name}`);
        setShowBanModal(false);
        setBanReason('');
        setSelectedUser(null);
        fetchUsers();
        fetchBanActions();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to ban user');
      }
    } catch (err) {
      setError('Failed to ban user');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      setError('Please provide a reason for unbanning');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          action: 'unban',
          reason: banReason,
        }),
      });

      if (response.ok) {
        setSuccess(`Successfully unbanned ${selectedUser.name}`);
        setShowUnbanModal(false);
        setBanReason('');
        setSelectedUser(null);
        fetchUsers();
        fetchBanActions();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to unban user');
      }
    } catch (err) {
      setError('Failed to unban user');
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'banned' && user.isBanned) ||
                         (filterStatus === 'active' && !user.isBanned);
    
    return matchesSearch && matchesFilter && !user.isAdmin; // Don't show admin users
  });

  if (loading) {
    return (
      <AdminLayout title="User Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Management">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-black">User Ban Management</h1>
              <p className="text-gray-600 mt-1">
                Ban or unban users with proper logging and reason tracking
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('authToken');
                  const response = await fetch('/api/admin/debug-users', {
                    headers: { 'Authorization': `Bearer ${token}` },
                  });
                  const data = await response.json();
                  console.log('Debug info:', data);
                  alert(`Total users: ${data.totalUsers}, Admin: ${data.adminCount}, Banned: ${data.bannedCount}`);
                } catch (err) {
                  console.error('Debug error:', err);
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Debug Users
            </button>
          </div>
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

        {/* Filters */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Search Users
              </label>
              <input
                type="text"
                placeholder="Search by name or phone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Filter by Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'banned')}
              >
                <option value="all">All Users</option>
                <option value="active">Active Users</option>
                <option value="banned">Banned Users</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white text-black shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">
              Users ({filteredUsers.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ban Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                      <div className="text-xs text-gray-400">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{user.balance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isBanned
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.isBanned ? (
                        <div>
                          <div className="font-medium">Reason: {user.banReason}</div>
                          <div className="text-xs text-gray-500">
                            By: {user.bannedBy?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            On: {user.bannedAt ? new Date(user.bannedAt).toLocaleString() : 'Unknown'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.isBanned ? (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUnbanModal(true);
                            setBanReason('');
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowBanModal(true);
                            setBanReason('');
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Ban
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Ban Actions */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Recent Ban Actions</h2>
          
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
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banActions.slice(0, 10).map((action) => (
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
                        action.action === 'ban'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {action.action === 'ban' ? 'Banned' : 'Unbanned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {action.adminId.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {action.reason}
                    </td>
                  </tr>
                ))}
                {banActions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No ban actions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white text-black rounded-lg p-6 m-4 max-w-md w-full">
            <h3 className="text-lg font-medium text-black mb-4">
              Ban User: {selectedUser.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This will prevent the user from accessing the platform. Provide a reason for this action.
            </p>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Enter reason for banning this user..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                disabled={processing || !banReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Banning...' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Modal */}
      {showUnbanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white text-black rounded-lg p-6 m-4 max-w-md w-full">
            <h3 className="text-lg font-medium text-black mb-4">
              Unban User: {selectedUser.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This will restore the user's access to the platform. Provide a reason for this action.
            </p>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Enter reason for unbanning this user..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowUnbanModal(false);
                  setBanReason('');
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUnbanUser}
                disabled={processing || !banReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Unbanning...' : 'Unban User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
