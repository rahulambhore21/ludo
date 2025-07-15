'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface AdminStats {
  totalUsers: number;
  totalCoinsInSystem: number;
  totalPlatformEarnings: number;
  conflictsPending: number;
  transactionsToday: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch admin stats');
      }

      // Map the enhanced stats to the expected format
      const mappedStats = {
        totalUsers: data.stats.users.total,
        totalCoinsInSystem: data.stats.users.totalCoinsInSystem,
        totalPlatformEarnings: data.stats.earnings.total,
        conflictsPending: data.stats.matches.conflicts,
        transactionsToday: data.stats.transactions.depositsToday + data.stats.transactions.withdrawalsToday,
        pendingDeposits: data.stats.transactions.pendingDeposits,
        pendingWithdrawals: data.stats.transactions.pendingWithdrawals,
      };

      setStats(mappedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="text-center">
          <div className="text-gray-600">Loading statistics...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div className="text-center">
          <div className="text-red-600">{error}</div>
          <button
            onClick={fetchAdminStats}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Total Users */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">
                    {stats?.totalUsers || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Coins in System */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💰</span>
                </div>
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    Coins in System
                  </dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">
                    {stats?.totalCoinsInSystem || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Earnings */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💎</span>
                </div>
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    Platform Earnings
                  </dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">
                    {stats?.totalPlatformEarnings || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Today */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📈</span>
                </div>
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    Transactions Today
                  </dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">
                    {stats?.transactionsToday || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Pending Deposits */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-4 sm:px-4 sm:py-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">
                  Pending Deposits
                </h3>
                <p className="mt-1 text-2xl sm:text-3xl font-semibold text-green-600">
                  {stats?.pendingDeposits || 0}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-base sm:text-lg">↓</span>
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <a
                href="/admin/transactions?filter=deposit&status=pending"
                className="text-indigo-600 hover:text-indigo-500 text-xs sm:text-sm font-medium"
              >
                Review deposits →
              </a>
            </div>
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-4 sm:px-4 sm:py-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">
                  Pending Withdrawals
                </h3>
                <p className="mt-1 text-2xl sm:text-3xl font-semibold text-red-600">
                  {stats?.pendingWithdrawals || 0}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-base sm:text-lg">↑</span>
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <a
                href="/admin/transactions?filter=withdrawal&status=pending"
                className="text-indigo-600 hover:text-indigo-500 text-xs sm:text-sm font-medium"
              >
                Review withdrawals →
              </a>
            </div>
          </div>
        </div>

        {/* Match Conflicts */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-4 sm:px-4 sm:py-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">
                  Match Conflicts
                </h3>
                <p className="mt-1 text-2xl sm:text-3xl font-semibold text-orange-600">
                  {stats?.conflictsPending || 0}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-base sm:text-lg">⚔️</span>
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <a
                href="/admin/matches"
                className="text-indigo-600 hover:text-indigo-500 text-xs sm:text-sm font-medium"
              >
                Resolve conflicts →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
          <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-3 sm:mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            <a
              href="/admin/transactions"
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-center block"
            >
              Review Transactions
            </a>
            <a
              href="/admin/matches"
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-center block"
            >
              Resolve Conflicts
            </a>
            <a
              href="/admin/users"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-center block"
            >
              Manage Users
            </a>
            <button
              onClick={fetchAdminStats}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium"
            >
              Refresh Stats
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
