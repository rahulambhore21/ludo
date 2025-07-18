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

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and admin status
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Fetch user profile to verify admin status
    fetch('/api/protected/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        if (data.user) {
          if (data.user.isAdmin) {
            setUser(data.user);
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/auth/login');
        }
      })
      .catch(() => {
        router.push('/auth/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 mr-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Open sidebar"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{title}</h1>
                <p className="text-xs sm:text-sm text-gray-600">Admin Panel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-700 hidden sm:block max-w-32 lg:max-w-none truncate">
                Welcome, {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm transition-colors"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white shadow-lg 
          transform transition-transform duration-300 ease-in-out lg:h-screen
        `}>
          <div className="p-3 sm:p-4 pt-16 lg:pt-4 h-full overflow-y-auto">
            
            {/* Close button for mobile */}
            <div className="lg:hidden flex justify-end mb-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                aria-label="Close sidebar"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Platform Overview */}
            <div className="mb-4 sm:mb-6">
              <h4 className="px-2 sm:px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Overview</h4>
              <div className="space-y-1">
                <Link
                  href="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">📊</span>
                  <span className="truncate">Dashboard</span>
                </Link>
                <Link
                  href="/admin/reports"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">📈</span>
                  <span className="truncate">Analytics & Reports</span>
                </Link>
              </div>
            </div>

            {/* Financial Management */}
            <div className="mb-4 sm:mb-6">
              <h4 className="px-2 sm:px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Financial</h4>
              <div className="space-y-1">
                <Link
                  href="/admin/transactions"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">💰</span>
                  <span className="truncate">Transactions</span>
                </Link>
                <Link
                  href="/admin/wallet-management"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">💳</span>
                  <span className="truncate">Wallet Management</span>
                </Link>
                <Link
                  href="/admin/refunds"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">💸</span>
                  <span className="truncate">Refunds</span>
                </Link>
              </div>
            </div>

            {/* Game Management */}
            <div className="mb-4 sm:mb-6">
              <h4 className="px-2 sm:px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Game Management</h4>
              <div className="space-y-1">
                <Link
                  href="/admin/matches"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">⚔️</span>
                  <span className="truncate">Active Matches</span>
                </Link>
                <Link
                  href="/admin/cancel-requests"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">🚫</span>
                  <span className="truncate">Cancel Requests</span>
                </Link>
                <Link
                  href="/admin/match-override"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">⚖️</span>
                  <span className="truncate">Match Override</span>
                </Link>
                <Link
                  href="/admin/screenshot-reviewer"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">📷</span>
                  <span className="truncate">Screenshot Review</span>
                </Link>
              </div>
            </div>

            {/* User Management */}
            <div className="mb-4 sm:mb-6">
              <h4 className="px-2 sm:px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Management</h4>
              <div className="space-y-1">
                <Link
                  href="/admin/users"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">👥</span>
                  <span className="truncate">All Users</span>
                </Link>
                <Link
                  href="/admin/user-bans"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">🚫</span>
                  <span className="truncate">User Bans</span>
                </Link>
              </div>
            </div>

            {/* Security & Monitoring */}
            <div className="mb-4 sm:mb-6">
              <h4 className="px-2 sm:px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Security</h4>
              <div className="space-y-1">
                <Link
                  href="/admin/disputes"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">⚠️</span>
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">Dispute Tracking</span>
                    <span className="bg-red-100 text-red-800 text-xs px-1 sm:px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      New
                    </span>
                  </div>
                </Link>
                <Link
                  href="/admin/wallet-audits"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">🔐</span>
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">Wallet Audits</span>
                    <span className="bg-purple-100 text-purple-800 text-xs px-1 sm:px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      New
                    </span>
                  </div>
                </Link>
                <Link
                  href="/admin/action-logs"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">📝</span>
                  <span className="truncate">Action Logs</span>
                </Link>
                <Link
                  href="/admin/monitoring"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">🔔</span>
                  <span className="truncate">Platform Monitoring</span>
                </Link>
              </div>
            </div>

            {/* System Management */}
            <div className="mb-4 sm:mb-6">
              <h4 className="px-2 sm:px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">System</h4>
              <div className="space-y-1">
                <Link
                  href="/admin/maintenance"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  <span className="mr-2 sm:mr-3 text-base sm:text-lg">🔧</span>
                  <span className="truncate">Maintenance Mode</span>
                </Link>
              </div>
            </div>
              
            <div className="border-t pt-4 mt-4 sm:mt-6">
              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-md transition-colors"
              >
                <span className="mr-2 sm:mr-3 text-base sm:text-lg">←</span>
                <span className="truncate">Back to User Dashboard</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-2 sm:p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
