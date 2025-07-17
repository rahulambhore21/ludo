'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';

interface Dispute {
  _id: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
    balance: number;
    flagged: boolean;
  };
  type: 'conflict' | 'cancel_request' | 'repeated_dispute' | 'suspicious_behavior' | 'fake_proof' | 'payment_dispute';
  matchId?: {
    _id: string;
    roomCode: string;
    entryFee: number;
    status: string;
  };
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  riskScore: number;
  frequency: {
    totalDisputes: number;
    disputesThisMonth: number;
    disputesThisWeek: number;
  };
  autoFlagged: boolean;
  createdAt: string;
  resolvedBy?: {
    name: string;
    phone: string;
  };
  adminNotes?: string;
  actionTaken?: string;
}

interface DisputeStats {
  averageRiskScore: number;
  highRiskCount: number;
  autoFlaggedCount: number;
  totalDisputes: number;
}

interface ProblemUser {
  _id: string;
  disputeCount: number;
  averageRiskScore: number;
  lastDispute: string;
  types: string[];
  user: {
    name: string;
    phone: string;
    balance: number;
  };
}

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [problemUsers, setProblemUsers] = useState<ProblemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    type: 'all',
    riskThreshold: 0
  });
  const [actionModal, setActionModal] = useState<{
    dispute: Dispute | null;
    isOpen: boolean;
  }>({ dispute: null, isOpen: false });
  const [actionForm, setActionForm] = useState({
    action: '',
    adminNotes: '',
    actionTaken: ''
  });

  useEffect(() => {
    fetchDisputes();
  }, [page, filters]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters,
        riskThreshold: filters.riskThreshold.toString()
      });

      const response = await fetch(`/api/admin/disputes?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch disputes');
      }

      const data = await response.json();
      setDisputes(data.disputes);
      setStats(data.statistics);
      setProblemUsers(data.problemUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal.dispute || !actionForm.action) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/disputes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disputeId: actionModal.dispute._id,
          ...actionForm
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update dispute');
      }

      setActionModal({ dispute: null, isOpen: false });
      setActionForm({ action: '', adminNotes: '', actionTaken: '' });
      fetchDisputes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dispute');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'investigating': return 'text-purple-600 bg-purple-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'dismissed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 font-bold';
    if (score >= 60) return 'text-orange-600 font-semibold';
    if (score >= 40) return 'text-yellow-600 font-medium';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <AdminLayout title="Dispute Tracking">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dispute Tracking & User Monitoring">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Total Disputes</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalDisputes || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">High Risk Users</h3>
            <p className="text-3xl font-bold text-red-600">{stats?.highRiskCount || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Auto-Flagged</h3>
            <p className="text-3xl font-bold text-orange-600">{stats?.autoFlaggedCount || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Avg Risk Score</h3>
            <p className="text-3xl font-bold text-purple-600">{Math.round(stats?.averageRiskScore || 0)}</p>
          </div>
        </div>

        {/* Problem Users */}
        {problemUsers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Problem Users (Last 30 Days)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-left">Disputes</th>
                    <th className="px-4 py-2 text-left">Risk Score</th>
                    <th className="px-4 py-2 text-left">Types</th>
                    <th className="px-4 py-2 text-left">Last Dispute</th>
                  </tr>
                </thead>
                <tbody>
                  {problemUsers.map((user) => (
                    <tr key={user._id} className="border-t">
                      <td className="px-4 py-2">
                        <div>
                          <p className="font-medium">{user.user.name}</p>
                          <p className="text-sm text-gray-600">{user.user.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                          {user.disputeCount}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={getRiskScoreColor(user.averageRiskScore)}>
                          {Math.round(user.averageRiskScore)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {user.types.map((type, idx) => (
                            <span key={idx} className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {new Date(user.lastDispute).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>

            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Types</option>
              <option value="conflict">Conflicts</option>
              <option value="cancel_request">Cancel Requests</option>
              <option value="suspicious_behavior">Suspicious Behavior</option>
              <option value="fake_proof">Fake Proof</option>
            </select>

            <input
              type="number"
              placeholder="Min Risk Score"
              value={filters.riskThreshold}
              onChange={(e) => setFilters({ ...filters, riskThreshold: parseInt(e.target.value) || 0 })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />

            <button
              onClick={() => setPage(1)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Disputes List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Recent Disputes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {disputes.map((dispute) => (
                  <tr key={dispute._id} className={dispute.autoFlagged ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{dispute.userId.name}</p>
                        <p className="text-sm text-gray-500">{dispute.userId.phone}</p>
                        {dispute.userId.flagged && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Flagged
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {dispute.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getRiskScoreColor(dispute.riskScore)}`}>
                        {dispute.riskScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(dispute.severity)}`}>
                        {dispute.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                        {dispute.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p>Total: {dispute.frequency.totalDisputes}</p>
                        <p className="text-xs text-gray-500">Week: {dispute.frequency.disputesThisWeek}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setActionModal({ dispute, isOpen: true })}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Take Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Modal */}
        {actionModal.isOpen && actionModal.dispute && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Take Action on Dispute
                </h3>
                
                <div className="mb-4 p-4 bg-gray-50 rounded">
                  <p><strong>User:</strong> {actionModal.dispute.userId.name}</p>
                  <p><strong>Type:</strong> {actionModal.dispute.type}</p>
                  <p><strong>Description:</strong> {actionModal.dispute.description}</p>
                  <p><strong>Risk Score:</strong> {actionModal.dispute.riskScore}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Action</label>
                    <select
                      value={actionForm.action}
                      onChange={(e) => setActionForm({ ...actionForm, action: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select action</option>
                      <option value="resolve">Resolve</option>
                      <option value="dismiss">Dismiss</option>
                      <option value="investigate">Investigate</option>
                      <option value="take_action">Take Action</option>
                    </select>
                  </div>

                  {actionForm.action === 'take_action' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Action Taken</label>
                      <select
                        value={actionForm.actionTaken}
                        onChange={(e) => setActionForm({ ...actionForm, actionTaken: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select action taken</option>
                        <option value="warning">Warning</option>
                        <option value="temporary_ban">Temporary Ban</option>
                        <option value="permanent_ban">Permanent Ban</option>
                        <option value="account_restriction">Account Restriction</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                    <textarea
                      value={actionForm.adminNotes}
                      onChange={(e) => setActionForm({ ...actionForm, adminNotes: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter admin notes..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setActionModal({ dispute: null, isOpen: false })}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAction}
                    disabled={!actionForm.action}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
