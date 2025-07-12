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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {error || 'Failed to load referral data'}
          </h2>
          <button 
            onClick={fetchReferralData}
            className="text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                ←
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Referrals</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{referralData.totalReferrals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">🎁</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₹{referralData.totalEarnings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recent Rewards</p>
                <p className="text-2xl font-bold text-gray-900">{referralData.recentRewards.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex-1">
                <p className="text-2xl font-mono font-bold text-center text-blue-600">
                  {referralData.referralCode}
                </p>
              </div>
              <button
                onClick={copyReferralCode}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <span>📋</span>
                <span>Copy Code</span>
              </button>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={copyReferralLink}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
              >
                <span>🔗</span>
                <span>Copy Referral Link</span>
              </button>
              <button
                onClick={shareOnWhatsApp}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center space-x-2"
              >
                <span>📱</span>
                <span>Share on WhatsApp</span>
              </button>
            </div>
            
            {copySuccess && (
              <p className="text-green-600 text-sm text-center">Copied to clipboard!</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'users', name: 'Referred Users' },
                { id: 'rewards', name: 'Reward History' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">How Referrals Work</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>• Share your referral code with friends</li>
                      <li>• When they sign up using your code, they get linked to you</li>
                      <li>• Every time they win a match, you earn 1% of the total pot</li>
                      <li>• Rewards come from the platform's commission (not player earnings)</li>
                      <li>• Your earnings are automatically added to your wallet</li>
                      <li>• Track all your referrals and earnings in real-time</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Referred Users</h3>
                {referralData.referredUsers.length > 0 ? (
                  <div className="space-y-4">
                    {referralData.referredUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Joined</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(user.joinedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-6xl">👥</span>
                    <p className="text-gray-500 mt-4">No referrals yet</p>
                    <p className="text-sm text-gray-400">Share your referral code to get started!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rewards' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reward History</h3>
                {referralData.recentRewards.length > 0 ? (
                  <div className="space-y-4">
                    {referralData.recentRewards.map((reward) => (
                      <div key={reward.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">₹{reward.amount}</p>
                          <p className="text-sm text-gray-500">{reward.description}</p>
                          {reward.matchPot && (
                            <p className="text-xs text-blue-600">
                              From ₹{reward.matchPot} match (1% reward)
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            📅 {formatDate(reward.createdAt)}
                          </p>
                          {reward.matchId && (
                            <p className="text-xs text-gray-400">
                              Match: {reward.matchId.slice(-6)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-6xl">🎁</span>
                    <p className="text-gray-500 mt-4">No rewards yet</p>
                    <p className="text-sm text-gray-400">Rewards appear when your referrals win matches!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
