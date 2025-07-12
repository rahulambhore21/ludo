'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

interface Transaction {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    phone: string;
  };
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  proofUrl?: string;
  upiId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [processingTransaction, setProcessingTransaction] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Get filters from URL params
    const urlFilter = searchParams.get('filter') as 'deposit' | 'withdrawal' | null;
    const urlStatus = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    
    if (urlFilter) setFilter(urlFilter);
    if (urlStatus) setStatus(urlStatus);
    
    fetchTransactions();
  }, [searchParams]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      setTransactions(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAction = async (
    transactionId: string, 
    action: 'approve' | 'reject',
    note?: string
  ) => {
    setProcessingTransaction(transactionId);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/transactions/${transactionId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} transaction`);
      }

      // Refresh transactions
      await fetchTransactions();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessingTransaction(null);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter !== 'all' && transaction.type !== filter) return false;
    if (status !== 'all' && transaction.status !== status) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'deposit' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <AdminLayout title="Transaction Management">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <button
            onClick={fetchTransactions}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Transactions ({filteredTransactions.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="text-gray-600">Loading transactions...</div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">No transactions found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.userId?.name || 'System'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.userId?.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getTypeColor(transaction.type)}`}>
                        {transaction.type === 'deposit' ? '↓ Deposit' : '↑ Withdrawal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        {transaction.amount} coins
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {transaction.type === 'deposit' && transaction.proofUrl && (
                          <a
                            href={transaction.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            View Proof
                          </a>
                        )}
                        {transaction.type === 'withdrawal' && (
                          <div>UPI: {transaction.upiId}</div>
                        )}
                        {transaction.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {transaction.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transaction.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleTransactionAction(transaction._id, 'approve')}
                            disabled={processingTransaction === transaction._id}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                          >
                            {processingTransaction === transaction._id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleTransactionAction(transaction._id, 'reject')}
                            disabled={processingTransaction === transaction._id}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
