'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  balance: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/register');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      router.push('/auth/register');
      return;
    }

    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/auth/register');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Ludo Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Hello, {user.name}! 👋
              </h2>
              <p className="text-gray-600">Welcome to your dashboard</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Balance Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">₹</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Coin Balance
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {user.balance}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📱</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Phone Number
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {user.phone}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Status Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${user.isAdmin ? 'bg-purple-500' : 'bg-gray-500'} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-sm font-bold">
                        {user.isAdmin ? '👑' : '👤'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Account Type
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {user.isAdmin ? 'Admin' : 'User'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Actions */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Wallet Actions
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Link
                  href="/wallet/deposit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                >
                  Add Coins
                </Link>
                <Link
                  href="/wallet/withdraw"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                >
                  Withdraw
                </Link>
                <Link
                  href="/wallet/history"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                >
                  History
                </Link>
                <Link
                  href="/referrals"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                >
                  🎁 Referrals
                </Link>
              </div>
            </div>
          </div>

          {/* Match Actions */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Match Actions
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Link
                  href="/match/create"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                >
                  Create Match
                </Link>
                <Link
                  href="/match/browse"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                >
                  Browse Matches
                </Link>
                <Link
                  href="/match/history"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                >
                  Match History
                </Link>
                <Link
                  href="/leaderboard"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                >
                  🏆 Leaderboard
                </Link>
              </div>
            </div>
          </div>

          {/* Admin Panel (Only for Admins) */}
          {user.isAdmin && (
            <div className="mt-8 bg-red-50 border border-red-200 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-2">👑</span>
                  <h3 className="text-lg leading-6 font-medium text-red-800">
                    Admin Control Panel
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Link
                    href="/admin"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                  >
                    📊 Dashboard
                  </Link>
                  <Link
                    href="/admin/transactions"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                  >
                    💰 Transactions
                  </Link>
                  <Link
                    href="/admin/matches"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                  >
                    ⚔️ Conflicts
                  </Link>
                  <Link
                    href="/admin/users"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                  >
                    👥 Users
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
