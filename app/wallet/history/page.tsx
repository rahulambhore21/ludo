'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'referral-reward';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  proofUrl?: string;
  upiId?: string;
  description?: string;
}

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  balance: number;
}

export default function WalletHistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      fetchTransactions();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/wallet/history', {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      case 'referral-reward':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return '↓';
      case 'withdrawal':
        return '↑';
      case 'referral-reward':
        return '🎁';
      default:
        return '•';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'referral-reward':
        return 'Referral Reward';
      default:
        return type;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <Link 
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Current Balance */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Current Balance</h2>
          <p className="text-3xl font-bold text-green-600">{user.balance} Coins</p>
        </div>

        {/* Transactions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">All Transactions</h3>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-600">Loading transactions...</div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600">{error}</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">No transactions found</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`text-2xl ${getTypeColor(transaction.type)}`}>
                        {getTypeIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {getTypeLabel(transaction.type)}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {transaction.description && (
                          <p className="text-sm text-gray-500">
                            {transaction.description}
                          </p>
                        )}
                        {transaction.upiId && (
                          <p className="text-sm text-gray-500">
                            UPI: {transaction.upiId}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getTypeColor(transaction.type)}`}>
                        {transaction.type === 'withdrawal' ? '-' : '+'}{transaction.amount} coins
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{transaction.amount}
                      </div>
                    </div>
                  </div>
                  
                  {transaction.proofUrl && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Payment Proof:</p>
                      <a 
                        href={transaction.proofUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500 text-sm"
                      >
                        View Screenshot
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-center space-x-4">
          <Link
            href="/wallet/deposit"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Add Coins
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/wallet/withdraw"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Withdraw Coins
          </Link>
        </div>
      </main>
    </div>
  );
}
