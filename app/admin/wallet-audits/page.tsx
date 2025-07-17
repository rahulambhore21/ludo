'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';

interface WalletAudit {
  _id: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
    balance: number;
    flagged: boolean;
  };
  transactionType: 'deposit' | 'withdrawal' | 'match_entry' | 'match_win' | 'refund' | 'admin_adjustment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  ipAddress: string;
  userAgent: string;
  riskFlags: string[];
  fraudScore: number;
  verified: boolean;
  verifiedBy?: {
    name: string;
    phone: string;
  };
  verificationNotes?: string;
  createdAt: string;
  relatedTransaction?: {
    _id: string;
    type: string;
    amount: number;
  };
  relatedMatch?: {
    _id: string;
    roomCode: string;
    entryFee: number;
  };
}

interface AuditStats {
  totalAudits: number;
  flaggedAudits: number;
  averageFraudScore: number;
  verifiedAudits: number;
  totalAmount: number;
  highRiskAudits: number;
}

export default function AdminWalletAudits() {
  const [audits, setAudits] = useState<WalletAudit[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    transactionType: 'all',
    verified: 'all',
    fraudScoreMin: 0,
    startDate: '',
    endDate: '',
    userId: ''
  });
  const [verificationModal, setVerificationModal] = useState<{
    audit: WalletAudit | null;
    isOpen: boolean;
  }>({ audit: null, isOpen: false });
  const [verificationForm, setVerificationForm] = useState({
    verified: true,
    notes: ''
  });

  useEffect(() => {
    fetchAudits();
  }, [page, filters]);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters,
        fraudScoreMin: filters.fraudScoreMin.toString()
      });

      const response = await fetch(`/api/admin/wallet-audits?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallet audits');
      }

      const data = await response.json();
      setAudits(data.audits);
      setStats(data.statistics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!verificationModal.audit) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/wallet-audits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auditId: verificationModal.audit._id,
          ...verificationForm
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update audit verification');
      }

      setVerificationModal({ audit: null, isOpen: false });
      setVerificationForm({ verified: true, notes: '' });
      fetchAudits();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update verification');
    }
  };

  const getFraudScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-green-600 bg-green-100';
      case 'withdrawal': return 'text-red-600 bg-red-100';
      case 'match_entry': return 'text-blue-600 bg-blue-100';
      case 'match_win': return 'text-purple-600 bg-purple-100';
      case 'refund': return 'text-yellow-600 bg-yellow-100';
      case 'admin_adjustment': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatAmount = (amount: number) => {
    return amount >= 0 ? `+₹${amount}` : `-₹${Math.abs(amount)}`;
  };

  if (loading) {
    return (
      <AdminLayout title="Wallet Audits">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Wallet Security Audits">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Total Audits</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalAudits || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Flagged</h3>
            <p className="text-3xl font-bold text-red-600">{stats?.flaggedAudits || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">High Risk</h3>
            <p className="text-3xl font-bold text-orange-600">{stats?.highRiskAudits || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Verified</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.verifiedAudits || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Avg Fraud Score</h3>
            <p className="text-3xl font-bold text-purple-600">{Math.round(stats?.averageFraudScore || 0)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Total Amount</h3>
            <p className="text-2xl font-bold text-indigo-600">₹{stats?.totalAmount?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <select
              value={filters.transactionType}
              onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="match_entry">Match Entry</option>
              <option value="match_win">Match Wins</option>
              <option value="refund">Refunds</option>
              <option value="admin_adjustment">Admin Adjustments</option>
            </select>

            <select
              value={filters.verified}
              onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>

            <input
              type="number"
              placeholder="Min Fraud Score"
              value={filters.fraudScoreMin}
              onChange={(e) => setFilters({ ...filters, fraudScoreMin: parseInt(e.target.value) || 0 })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
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

        {/* Audit Trail */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Wallet Audit Trail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fraud Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Flags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {audits.map((audit) => (
                  <tr key={audit._id} className={audit.riskFlags.length > 0 ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{audit.userId.name}</p>
                        <p className="text-sm text-gray-500">{audit.userId.phone}</p>
                        {audit.userId.flagged && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Flagged
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(audit.transactionType)}`}>
                          {audit.transactionType.replace('_', ' ')}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(audit.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${audit.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAmount(audit.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p>Before: ₹{audit.balanceBefore}</p>
                        <p>After: ₹{audit.balanceAfter}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFraudScoreColor(audit.fraudScore)}`}>
                        {audit.fraudScore}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {audit.riskFlags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {audit.riskFlags.map((flag, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                              {flag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-green-600 text-sm">Clean</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {audit.verified ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                          {audit.verifiedBy && (
                            <span className="text-xs text-gray-500 ml-2">
                              by {audit.verifiedBy.name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setVerificationModal({ audit, isOpen: true })}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {audit.verified ? 'Update' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={audits.length < 20}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Verification Modal */}
        {verificationModal.isOpen && verificationModal.audit && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Verify Wallet Audit
                </h3>
                
                <div className="mb-4 p-4 bg-gray-50 rounded">
                  <p><strong>User:</strong> {verificationModal.audit.userId.name}</p>
                  <p><strong>Transaction:</strong> {verificationModal.audit.transactionType}</p>
                  <p><strong>Amount:</strong> {formatAmount(verificationModal.audit.amount)}</p>
                  <p><strong>Fraud Score:</strong> {verificationModal.audit.fraudScore}</p>
                  <p><strong>IP Address:</strong> {verificationModal.audit.ipAddress}</p>
                  {verificationModal.audit.riskFlags.length > 0 && (
                    <div className="mt-2">
                      <strong>Risk Flags:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {verificationModal.audit.riskFlags.map((flag, idx) => (
                          <span key={idx} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Verification Status</label>
                    <select
                      value={verificationForm.verified.toString()}
                      onChange={(e) => setVerificationForm({ ...verificationForm, verified: e.target.value === 'true' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="true">Verified - Transaction is legitimate</option>
                      <option value="false">Flagged - Transaction needs investigation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Verification Notes</label>
                    <textarea
                      value={verificationForm.notes}
                      onChange={(e) => setVerificationForm({ ...verificationForm, notes: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter verification notes..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setVerificationModal({ audit: null, isOpen: false })}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerification}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Update Verification
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
