'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Redirect to dashboard if already logged in
      router.push('/dashboard');
    } else {
      // Show the landing page
      setLoading(false);
    }
  }, [router]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="mt-6 text-4xl font-extrabold text-gray-900">
            Welcome to Ludo Game
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Play, Win, and Earn Coins!
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Secure OTP-based authentication system
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/register"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Account
          </Link>
          
          <Link
            href="/auth/login"
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Login to Existing Account
          </Link>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
