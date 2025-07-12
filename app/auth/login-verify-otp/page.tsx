'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginVerifyOTPPage() {
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    // Get phone from localStorage
    const storedPhone = localStorage.getItem('loginPhone');
    if (storedPhone) {
      setPhone(storedPhone);
    } else {
      // Redirect to login if no phone
      router.push('/auth/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login-verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      // Store JWT token
      localStorage.setItem('authToken', data.token);
      localStorage.removeItem('loginPhone');

      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      router.push('/dashboard');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!phone) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      alert('OTP sent successfully!');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!phone) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify OTP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the 6-digit code sent to {phone}
          </p>
          <p className="mt-1 text-center text-xs text-blue-600">
            Development OTP: 123456
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="sr-only">
              OTP
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              maxLength={6}
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 text-center text-2xl tracking-widest focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
            >
              Resend OTP
            </button>

            <div className="text-center">
              <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-500">
                ← Back to Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
