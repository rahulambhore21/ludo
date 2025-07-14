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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600">Admin Panel</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-lg h-screen sticky top-0">
          <div className="p-4">
            <div className="space-y-2">
              <Link
                href="/admin"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                📊 Dashboard
              </Link>
              <Link
                href="/admin/matches"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                ⚔️ Matches
              </Link>
              <Link
                href="/admin/transactions"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                💰 Transactions
              </Link>
              <Link
                href="/admin/cancel-requests"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                🚫 Cancel Requests
              </Link>
              <Link
                href="/admin/users"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                👥 Users
              </Link>
              <Link
                href="/admin/refunds"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                💸 Refunds
              </Link>
              <Link
                href="/admin/reports"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                📈 Reports
              </Link>
              <div className="border-t pt-2 mt-4">
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                >
                  ← Back to User Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
