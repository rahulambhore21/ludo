'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalCoinsInSystem: number;
  totalPlatformEarnings: number;
  conflictsPending: number;
  transactionsToday: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  urgent?: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const quickActions: QuickAction[] = [
    {
      title: 'Pending Transactions',
      description: `${(stats?.pendingDeposits || 0) + (stats?.pendingWithdrawals || 0)} transactions need approval`,
      href: '/admin/transactions',
      icon: '💰',
      color: 'bg-yellow-500',
      urgent: (stats?.pendingDeposits || 0) + (stats?.pendingWithdrawals || 0) > 0
    },
    {
      title: 'Active Disputes',
      description: `${stats?.conflictsPending || 0} disputes require attention`,
      href: '/admin/disputes',
      icon: '⚠️',
      color: 'bg-red-500',
      urgent: (stats?.conflictsPending || 0) > 0
    },
    {
      title: 'Security Audits',
      description: 'Review wallet security and fraud detection',
      href: '/admin/wallet-audits',
      icon: '🔐',
      color: 'bg-purple-500'
    },
    {
      title: 'User Management',
      description: 'Manage users, bans, and restrictions',
      href: '/admin/users',
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      title: 'Match Oversight',
      description: 'Monitor and manage active matches',
      href: '/admin/matches',
      icon: '⚔️',
      color: 'bg-green-500'
    },
    {
      title: 'Cancel Requests',
      description: 'Review match cancellation requests',
      href: '/admin/cancel-requests',
      icon: '🚫',
      color: 'bg-orange-500'
    },
    {
      title: 'Platform Reports',
      description: 'Detailed analytics and insights',
      href: '/admin/reports',
      icon: '📊',
      color: 'bg-indigo-500'
    },
    {
      title: 'System Settings',
      description: 'Configure platform maintenance and settings',
      href: '/admin/maintenance',
      icon: '⚙️',
      color: 'bg-gray-500'
    }
  ];

  useEffect(() => {
    fetchAdminStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchAdminStats, 30000);
    return () => clearInterval(interval);
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
      <AdminLayout title="Admin Dashboard">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Admin Dashboard">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">⚠️ Error loading dashboard</div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchAdminStats}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome to Admin Dashboard</h1>
          <p className="text-blue-100">Manage your Ludo platform with comprehensive tools and real-time insights</p>
        </div>

        {/* Alert Section for Urgent Items */}
        {((stats?.pendingDeposits || 0) + (stats?.pendingWithdrawals || 0) > 0 || (stats?.conflictsPending || 0) > 0) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
            <div className="flex items-center">
              <div className="text-yellow-400 text-2xl mr-3">⚠️</div>
              <div>
                <h3 className="text-lg font-medium text-yellow-800">Attention Required</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  {(stats?.pendingDeposits || 0) + (stats?.pendingWithdrawals || 0) > 0 && (
                    <p>• {(stats?.pendingDeposits || 0) + (stats?.pendingWithdrawals || 0)} pending transactions need approval</p>
                  )}
                  {(stats?.conflictsPending || 0) > 0 && (
                    <p>• {stats?.conflictsPending} active disputes require resolution</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Coins in System</p>
                <p className="text-3xl font-bold text-gray-900">₹{stats?.totalCoinsInSystem?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Earnings</p>
                <p className="text-3xl font-bold text-gray-900">₹{stats?.totalPlatformEarnings?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Transactions</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.transactionsToday || '0'}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className={`
                  bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer 
                  border-2 hover:border-blue-200 group transform hover:-translate-y-1
                  ${action.urgent ? 'ring-2 ring-red-200 border-red-300' : 'border-gray-100'}
                `}>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`${action.color} rounded-lg p-3 text-white text-xl`}>
                        {action.icon}
                      </div>
                      {action.urgent && (
                        <div className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          Urgent
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Platform Status</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Deposits</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  (stats?.pendingDeposits || 0) > 0 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {stats?.pendingDeposits || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Withdrawals</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  (stats?.pendingWithdrawals || 0) > 0 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {stats?.pendingWithdrawals || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Conflicts</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  (stats?.conflictsPending || 0) > 0 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {stats?.conflictsPending || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-3">
              <Link href="/admin/wallet-management" className="block text-sm text-blue-600 hover:text-blue-800">
                → Wallet Management
              </Link>
              <Link href="/admin/user-bans" className="block text-sm text-blue-600 hover:text-blue-800">
                → User Bans & Restrictions
              </Link>
              <Link href="/admin/action-logs" className="block text-sm text-blue-600 hover:text-blue-800">
                → Admin Action Logs
              </Link>
              <Link href="/admin/monitoring" className="block text-sm text-blue-600 hover:text-blue-800">
                → Platform Monitoring
              </Link>
              <Link href="/dashboard" className="block text-sm text-gray-600 hover:text-gray-800">
                → User Dashboard View
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
