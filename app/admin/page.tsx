'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminOverview from '@/components/AdminOverview';

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
      <AdminOverview stats={stats} />
    </AdminLayout>
  );
}
