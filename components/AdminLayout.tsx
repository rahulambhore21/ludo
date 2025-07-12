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
  const router = useRouter();

  useEffect(() => {
    // Check authentication and admin status
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (!parsedUser.isAdmin) {
        router.push('/dashboard');
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
      return;
    }

    setLoading(false);
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
      {/* Admin Header */}
      <header className="bg-red-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                👑 Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white">
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
                href="/admin/transactions"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                💰 Transactions
              </Link>
              <Link
                href="/admin/matches"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                ⚔️ Match Conflicts
              </Link>
              <Link
                href="/admin/users"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                👥 User Management
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
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
