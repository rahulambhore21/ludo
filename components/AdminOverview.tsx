'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SystemAlert {
  type: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    text: string;
    href: string;
  };
}

interface AdminOverviewProps {
  stats: {
    totalUsers: number;
    totalCoinsInSystem: number;
    totalPlatformEarnings: number;
    conflictsPending: number;
    transactionsToday: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
  } | null;
}

export default function AdminOverview({ stats }: AdminOverviewProps) {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  useEffect(() => {
    // Generate system alerts based on stats
    const newAlerts: SystemAlert[] = [];

    if (stats) {
      // Check for pending transactions
      const pendingTransactions = (stats.pendingDeposits || 0) + (stats.pendingWithdrawals || 0);
      if (pendingTransactions > 0) {
        newAlerts.push({
          type: 'urgent',
          title: 'Pending Transactions',
          message: `${pendingTransactions} transactions require immediate approval`,
          action: {
            text: 'Review Now',
            href: '/admin/transactions'
          }
        });
      }

      // Check for active conflicts
      if ((stats.conflictsPending || 0) > 0) {
        newAlerts.push({
          type: 'urgent',
          title: 'Active Disputes',
          message: `${stats.conflictsPending} disputes need resolution`,
          action: {
            text: 'Resolve Disputes',
            href: '/admin/disputes'
          }
        });
      }

      // Check for high transaction volume
      if ((stats.transactionsToday || 0) > 50) {
        newAlerts.push({
          type: 'info',
          title: 'High Activity',
          message: `${stats.transactionsToday} transactions processed today`,
          action: {
            text: 'View Reports',
            href: '/admin/reports'
          }
        });
      }

      // Check for low coins in system (potential cashflow issue)
      if ((stats.totalCoinsInSystem || 0) < 10000) {
        newAlerts.push({
          type: 'warning',
          title: 'Low System Balance',
          message: 'System coin balance is running low',
          action: {
            text: 'Monitor Wallets',
            href: '/admin/wallet-management'
          }
        });
      }
    }

    setAlerts(newAlerts);
  }, [stats]);

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getAlertStyles(alert.type)}`}
            >
              <div className="flex items-start">
                <div className="text-2xl mr-3">{getAlertIcon(alert.type)}</div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{alert.title}</h3>
                  <p className="text-sm mb-3">{alert.message}</p>
                  {alert.action && (
                    <Link
                      href={alert.action.href}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      {alert.action.text}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers?.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">₹{stats.totalCoinsInSystem?.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Coins in System</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">₹{stats.totalPlatformEarnings?.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Platform Earnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.transactionsToday}</div>
            <div className="text-sm text-gray-600">Today's Transactions</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/transactions"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-yellow-100 rounded-lg p-2 mr-3">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <div className="font-medium">Review Transactions</div>
              <div className="text-sm text-gray-600">
                {((stats.pendingDeposits || 0) + (stats.pendingWithdrawals || 0))} pending
              </div>
            </div>
          </Link>

          <Link
            href="/admin/disputes"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-red-100 rounded-lg p-2 mr-3">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <div className="font-medium">Resolve Disputes</div>
              <div className="text-sm text-gray-600">
                {stats.conflictsPending || 0} active conflicts
              </div>
            </div>
          </Link>

          <Link
            href="/admin/wallet-audits"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-purple-100 rounded-lg p-2 mr-3">
              <span className="text-xl">🔐</span>
            </div>
            <div>
              <div className="font-medium">Security Audits</div>
              <div className="text-sm text-gray-600">Monitor fraud detection</div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-blue-100 rounded-lg p-2 mr-3">
              <span className="text-xl">👥</span>
            </div>
            <div>
              <div className="font-medium">Manage Users</div>
              <div className="text-sm text-gray-600">{stats.totalUsers} registered users</div>
            </div>
          </Link>

          <Link
            href="/admin/matches"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-green-100 rounded-lg p-2 mr-3">
              <span className="text-xl">⚔️</span>
            </div>
            <div>
              <div className="font-medium">Active Matches</div>
              <div className="text-sm text-gray-600">Monitor ongoing games</div>
            </div>
          </Link>

          <Link
            href="/admin/reports"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-indigo-100 rounded-lg p-2 mr-3">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <div className="font-medium">View Reports</div>
              <div className="text-sm text-gray-600">Detailed analytics</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Deposits</span>
              <span className={`px-2 py-1 rounded-full text-sm ${
                (stats.pendingDeposits || 0) > 0 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {stats.pendingDeposits || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Withdrawals</span>
              <span className={`px-2 py-1 rounded-full text-sm ${
                (stats.pendingWithdrawals || 0) > 0 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {stats.pendingWithdrawals || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Today's Volume</span>
              <span className="font-semibold text-gray-900">
                {stats.transactionsToday || 0} transactions
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Platform Status</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                Online
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Conflicts</span>
              <span className={`px-2 py-1 rounded-full text-sm ${
                (stats.conflictsPending || 0) > 0 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {stats.conflictsPending || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Security Status</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                Protected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
