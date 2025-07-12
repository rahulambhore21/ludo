'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ReferredUser {
  id: string;
  name: string;
  phone: string;
  joinedAt: string;
}

interface ReferralReward {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
  matchId?: string;
  matchPot?: number;
  matchEntryFee?: number;
}

interface ReferralData {
  referralCode: string;
  referredUsers: ReferredUser[];
  recentRewards: ReferralReward[];
  totalEarnings: number;
  totalReferrals: number;
}

export default function ReferralsPage() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'rewards'>('overview');
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
      fetchReferralData();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchReferralData = async () => {
    try {
      setError('');
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/referrals', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch referral data');
        console.error('Failed to fetch referral data');
      }
    } catch (error) {
      setError('Failed to fetch referral data');
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (referralData) {
      try {
        await navigator.clipboard.writeText(referralData.referralCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const copyReferralLink = async () => {
    if (referralData) {
      const link = `${window.location.origin}/auth/register?ref=${referralData.referralCode}`;
      try {
        await navigator.clipboard.writeText(link);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const shareOnWhatsApp = () => {
    if (referralData) {
      const message = `🎮 Join me on Ludo Match! Use my referral code: ${referralData.referralCode} and start winning real money! 💰\n\nSign up here: ${window.location.origin}/auth/register?ref=${referralData.referralCode}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-600 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading referrals...</p>
        </div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {error || 'Failed to load referral data'}
          </h2>
          <button 
            onClick={fetchReferralData}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>

            {/* Title */}
            <h1 className="text-lg font-semibold text-gray-900">Refer & Earn</h1>
            
            {/* Empty space for balance */}
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="text-4xl mb-3">🤝</div>
          <h1 className="text-2xl font-bold text-gray-900">Invite Friends</h1>
          <p className="text-gray-600">Earn 1% from every match they win!</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white text-center">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-2xl font-bold">{referralData.totalReferrals}</div>
            <div className="text-xs text-blue-100">Friends</div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white text-center">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-2xl font-bold">₹{referralData.totalEarnings}</div>
            <div className="text-xs text-emerald-100">Earned</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white text-center">
            <div className="text-2xl mb-1">🎁</div>
            <div className="text-2xl font-bold">{referralData.recentRewards.length}</div>
            <div className="text-xs text-purple-100">Rewards</div>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Referral Code</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-3xl font-mono font-bold text-emerald-600 tracking-wider">
                {referralData.referralCode}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={copyReferralCode}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>📋</span>
              <span>Copy Referral Code</span>
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={copyReferralLink}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>🔗</span>
                <span>Copy Link</span>
              </button>
              
              <button
                onClick={shareOnWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>📱</span>
                <span>WhatsApp</span>
              </button>
            </div>
            
            {copySuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <span className="text-green-700 font-medium">✅ Copied to clipboard!</span>
              </div>
            )}
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">ℹ️</span>
            <h3 className="text-lg font-semibold text-orange-900">How It Works</h3>
          </div>
          <div className="space-y-3 text-sm text-orange-800">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <p>Share your referral code with friends</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <p>They register using your code</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <p>Earn 1% when they win matches!</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'Friends', icon: '👥' },
              { id: 'rewards', name: 'Rewards', icon: '🎁' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-4 text-sm font-medium text-center transition-colors ${
                  activeTab === tab.id
                    ? 'text-emerald-600 bg-emerald-50 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Earning Today!</h3>
                  <p className="text-gray-600 text-sm">
                    Every time your friends win a match, you earn 1% of the total match pot. 
                    The more friends you refer, the more you earn!
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg p-4 text-white text-center">
                  <div className="text-2xl font-bold">Unlimited Earning Potential</div>
                  <div className="text-sm text-emerald-100">No limits on referrals or earnings</div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                {referralData.referredUsers.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Your Friends ({referralData.referredUsers.length})
                    </h3>
                    {referralData.referredUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-emerald-600 font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Joined</p>
                          <p className="text-sm font-medium text-gray-600">{formatDate(user.joinedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Friends Yet</h3>
                    <p className="text-gray-600 text-sm">Share your referral code to get started!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rewards' && (
              <div>
                {referralData.recentRewards.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Recent Rewards ({referralData.recentRewards.length})
                    </h3>
                    {referralData.recentRewards.map((reward) => (
                      <div key={reward.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg">🎁</span>
                          </div>
                          <div>
                            <p className="font-semibold text-emerald-800">+₹{reward.amount}</p>
                            <p className="text-sm text-gray-600">{reward.description}</p>
                            {reward.matchPot && (
                              <p className="text-xs text-emerald-600">
                                From ₹{reward.matchPot} match pot
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {formatDate(reward.createdAt)}
                          </p>
                          {reward.matchId && (
                            <p className="text-xs text-gray-400">
                              #{reward.matchId.slice(-6)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🎁</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Rewards Yet</h3>
                    <p className="text-gray-600 text-sm">Rewards appear when your friends win matches!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Padding */}
        <div className="h-8"></div>
      </main>
    </div>
  );
}
