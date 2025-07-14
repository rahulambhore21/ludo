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
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-yellow-400 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="dice-icon text-4xl">🎲</div>
            </div>
          </div>
          <p className="mt-4 text-white font-semibold text-lg">Loading your game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      <div className="max-w-md w-full space-y-8">
        {/* Floating game elements */}
        <div className="absolute top-10 left-10 float-animation">
          <div className="text-6xl">🎯</div>
        </div>
        <div className="absolute top-20 right-20 float-animation" style={{animationDelay: '1s'}}>
          <div className="text-5xl">🏆</div>
        </div>
        <div className="absolute bottom-20 left-20 float-animation" style={{animationDelay: '2s'}}>
          <div className="text-4xl">💎</div>
        </div>
        
        <div className="game-card p-8 text-center coin-animation">
          <div className="mb-6">
            <div className="dice-icon text-8xl mb-4 mx-auto">🎲</div>
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
              Ludo Champions
            </h1>
            <p className="text-xl text-purple-600 font-semibold">
              🎮 Play • 🏆 Win • 💰 Earn Coins!
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 mb-6">
            <p className="text-white font-bold text-lg">
              ⚡ Real Money Gaming Platform ⚡
            </p>
            <p className="text-yellow-100 text-sm">
              Secure • Fair • Instant Payouts
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/auth/register"
              className="game-button w-full flex justify-center items-center py-4 px-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              🚀 Join the Game
            </Link>
            
            <Link
              href="/auth/login"
              className="group relative w-full flex justify-center items-center py-4 px-6 border-3 border-purple-400 text-lg font-bold rounded-xl text-purple-600 bg-white hover:bg-purple-50 hover:border-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              🎯 Login to Play
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg p-3 text-white">
              <div className="text-2xl mb-1">💯</div>
              <div className="text-xs font-semibold">100% Safe</div>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-3 text-white">
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-xs font-semibold">Instant Play</div>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg p-3 text-white">
              <div className="text-2xl mb-1">🎁</div>
              <div className="text-xs font-semibold">Daily Rewards</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-white text-sm bg-black bg-opacity-20 rounded-lg p-3">
            🔐 Secure OTP Authentication • 📱 Mobile Optimized
          </p>
        </div>
      </div>
    </div>
  );
}
