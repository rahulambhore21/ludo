'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface AdminStats {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    totalCoinsInSystem: number;
  };
  matches: {
    total: number;
    completed: number;
    active: number;
    waiting: number;
    conflicts: number;
    cancelled: number;
    totalPot: number;
  };
  earnings: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  transactions: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalVolume: number;
    depositsToday: number;
    withdrawalsToday: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
  };
  cancelRequests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  recentActivity: {
    matches: any[];
    transactions: any[];
  };
}

export default function AdminReports() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data.stats);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'approved': return 'bg-green-100 text-green-800';
      case 'active': case 'in-progress': case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'waiting': return 'bg-blue-100 text-blue-800';
      case 'conflict': case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Reports & Analytics">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Reports & Analytics">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout title="Reports & Analytics">
        <div className="text-center text-gray-500">No data available</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.users.total}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <span className="text-green-600">+{stats.users.newToday}</span> today
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Platform Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">₹{stats.earnings.total}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <span className="text-green-600">+₹{stats.earnings.today}</span> today
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Matches</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.matches.total}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <span className="text-green-600">{stats.matches.completed}</span> completed
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Conflicts</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.matches.conflicts}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <span className="text-yellow-600">{stats.cancelRequests.pending}</span> cancel requests
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Matches:</span>
                <span className="font-medium">{stats.matches.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-green-600">{stats.matches.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active/In Progress:</span>
                <span className="font-medium text-blue-600">{stats.matches.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Waiting for Players:</span>
                <span className="font-medium text-yellow-600">{stats.matches.waiting}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conflicts:</span>
                <span className="font-medium text-red-600">{stats.matches.conflicts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cancelled:</span>
                <span className="font-medium text-gray-600">{stats.matches.cancelled}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="text-gray-600">Total Pot Value:</span>
                <span className="font-medium">₹{stats.matches.totalPot}</span>
              </div>
            </div>
          </div>

          {/* Transaction Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Transactions:</span>
                <span className="font-medium">{stats.transactions.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="font-medium text-yellow-600">{stats.transactions.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Approved:</span>
                <span className="font-medium text-green-600">{stats.transactions.approved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rejected:</span>
                <span className="font-medium text-red-600">{stats.transactions.rejected}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Deposits:</span>
                <span className="font-medium text-yellow-600">{stats.transactions.pendingDeposits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Withdrawals:</span>
                <span className="font-medium text-yellow-600">{stats.transactions.pendingWithdrawals}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="text-gray-600">Total Volume:</span>
                <span className="font-medium">₹{stats.transactions.totalVolume}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₹{stats.earnings.today}</div>
              <div className="text-sm text-gray-600">Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₹{stats.earnings.thisWeek}</div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₹{stats.earnings.thisMonth}</div>
              <div className="text-sm text-gray-600">This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₹{stats.earnings.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Matches */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Matches</h3>
            <div className="space-y-3">
              {stats.recentActivity.matches.slice(0, 5).map((match: any) => (
                <div key={match._id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <div className="text-sm font-medium">
                      {match.player1?.name} vs {match.player2?.name || 'Waiting...'}
                    </div>
                    <div className="text-xs text-gray-500">
                      ₹{match.entryFee} • {formatDateTime(match.createdAt)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(match.status)}`}>
                    {match.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {stats.recentActivity.transactions.slice(0, 5).map((transaction: any) => (
                <div key={transaction._id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <div className="text-sm font-medium">
                      {transaction.userId?.name || 'System'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {transaction.type} • {formatDateTime(transaction.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">₹{transaction.amount}</div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.users.total}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+{stats.users.newThisWeek}</div>
              <div className="text-sm text-gray-600">New This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">₹{stats.users.totalCoinsInSystem}</div>
              <div className="text-sm text-gray-600">Total Coins in System</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
