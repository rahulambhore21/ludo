'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface AdminAction {
  _id: string;
  adminId: {
    _id: string;
    name: string;
    phone: string;
  };
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  timestamp: Date;
}

export default function AdminActionLogs() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  useEffect(() => {
    fetchActions();
  }, [filter, dateFilter]);

  const fetchActions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('action', filter);
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter);

      const response = await fetch(`/api/admin/action-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActions(data.actions);
      }
    } catch (err) {
      console.error('Error fetching admin actions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'wallet_topup':
      case 'wallet_deduct':
        return '💰';
      case 'user_ban':
      case 'user_unban':
        return '🚫';
      case 'match_override':
        return '⚖️';
      case 'screenshot_review':
        return '📷';
      case 'maintenance_toggle':
        return '🔧';
      default:
        return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'wallet_topup':
        return 'bg-green-100 text-green-800';
      case 'wallet_deduct':
        return 'bg-red-100 text-red-800';
      case 'user_ban':
        return 'bg-red-100 text-red-800';
      case 'user_unban':
        return 'bg-green-100 text-green-800';
      case 'match_override':
        return 'bg-yellow-100 text-yellow-800';
      case 'screenshot_review':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance_toggle':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActionDetails = (action: AdminAction) => {
    const { details } = action;
    
    switch (action.action) {
      case 'wallet_topup':
      case 'wallet_deduct':
        return `₹${details.amount} - ${details.reason || 'No reason provided'}`;
      case 'user_ban':
        return `Reason: ${details.reason || 'No reason provided'}`;
      case 'user_unban':
        return `Unbanned user`;
      case 'match_override':
        return `Winner: ${details.winnerId || 'Draw'} - ${details.reason}`;
      case 'screenshot_review':
        return `${details.action === 'approve' ? 'Approved' : 'Rejected'} screenshot`;
      case 'maintenance_toggle':
        return `${details.enabled ? 'Enabled' : 'Disabled'} maintenance mode`;
      default:
        return JSON.stringify(details).slice(0, 100) + '...';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Admin Action Logs">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Action Logs">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-black">Admin Action Logs</h1>
          <p className="text-gray-600 mt-1">
            Track all administrative actions and system changes
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Actions</option>
                <option value="wallet_topup">Wallet Top-up</option>
                <option value="wallet_deduct">Wallet Deduction</option>
                <option value="user_ban">User Ban</option>
                <option value="user_unban">User Unban</option>
                <option value="match_override">Match Override</option>
                <option value="screenshot_review">Screenshot Review</option>
                <option value="maintenance_toggle">Maintenance Toggle</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Logs */}
        <div className="bg-white text-black shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Recent Actions ({actions.length})
          </h2>
          
          <div className="space-y-4">
            {actions.map((action) => (
              <div key={action._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getActionIcon(action.action)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(action.action)}`}>
                          {action.action.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {action.targetType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatActionDetails(action)}
                      </p>
                      <div className="text-xs text-gray-500 mt-2">
                        <span>By: {action.adminId.name} ({action.adminId.phone})</span>
                        <span className="mx-2">•</span>
                        <span>Target ID: {action.targetId.slice(-8)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{new Date(action.timestamp).toLocaleDateString()}</div>
                    <div>{new Date(action.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {actions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No actions found</h3>
                <p className="text-gray-600">
                  No admin actions match the selected filters.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white text-black shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-blue-600">
                {actions.filter(a => a.action.includes('wallet')).length}
              </div>
              <div className="text-sm text-gray-600">Wallet Actions</div>
            </div>
          </div>
          
          <div className="bg-white text-black shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🚫</div>
              <div className="text-2xl font-bold text-red-600">
                {actions.filter(a => a.action.includes('ban')).length}
              </div>
              <div className="text-sm text-gray-600">User Actions</div>
            </div>
          </div>
          
          <div className="bg-white text-black shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl mb-2">⚖️</div>
              <div className="text-2xl font-bold text-yellow-600">
                {actions.filter(a => a.action === 'match_override').length}
              </div>
              <div className="text-sm text-gray-600">Match Overrides</div>
            </div>
          </div>
          
          <div className="bg-white text-black shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🔧</div>
              <div className="text-2xl font-bold text-purple-600">
                {actions.filter(a => a.action === 'maintenance_toggle').length}
              </div>
              <div className="text-sm text-gray-600">System Actions</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
