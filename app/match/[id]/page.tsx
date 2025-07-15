'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotifications } from '../../../contexts/NotificationContext';
import CancelGameModal from '../../../components/CancelGameModal';

interface Match {
  _id: string;
  player1: {
    _id: string;
    name: string;
    phone: string;
  };
  player2?: {
    _id: string;
    name: string;
    phone: string;
  } | null;
  entryFee: number;
  pot: number;
  roomCode: string;
  status: 'waiting' | 'active' | 'in-progress' | 'completed' | 'cancelled';
  winner?: {
    _id: string;
    name: string;
  } | null;
  userRole?: string;
  userResult?: string;
  opponentResult?: string;
  opponent?: {
    _id: string;
    name: string;
    phone: string;
  } | null;
  isWinner?: boolean;
  userPayout?: number;
  canJoin?: boolean;
  canSubmitResult?: boolean;
  createdAt: string;
  completedAt?: string;
}

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  balance: number;
}

interface MatchPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MatchPage({ params }: MatchPageProps) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingResult, setSubmittingResult] = useState(false);
  const [resultSubmitted, setResultSubmitted] = useState(false);
  const [proofShot, setProofShot] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const router = useRouter();
  const { showToast } = useNotifications();

  const fetchMatch = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/match/${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch match');
      }

      console.log('Match data received:', data.match);
      setMatch(data.match);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('error', 'Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Image size should be less than 5MB');
        return;
      }

      setProofShot(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setProofPreview(url);
    }
  };

  const handleSubmitResult = async (result: 'win' | 'loss') => {
    if (!match || !user) return;

    // Require screenshot for win claims
    if (result === 'win' && !proofShot) {
      showToast('error', 'Screenshot proof is required to claim victory');
      return;
    }

    setSubmittingResult(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      
      if (result === 'win' && proofShot) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('result', result);
        formData.append('screenshot', proofShot);

        const response = await fetch(`/api/match/submit-result/${match._id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit result');
        }

        setResultSubmitted(true);
        showToast('success', 'Result submitted successfully');
        
        // Refresh match data
        await fetchMatch();

        // Update user balance if won
        if (data.winnings) {
          const updatedUser = { ...user, balance: user.balance + data.winnings };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } else {
        // Regular JSON request for loss
        const response = await fetch(`/api/match/submit-result/${match._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ result }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit result');
        }

        setResultSubmitted(true);
        showToast('success', 'Result submitted successfully');
        
        // Refresh match data
        await fetchMatch();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit result';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setSubmittingResult(false);
    }
  };

  const handleJoinMatch = async () => {
    if (!user || !match) return;

    if (user.balance < match.entryFee) {
      setError('Insufficient balance to join this match');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/match/join/${match._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join match');
      }

      // Update user balance
      const updatedUser = { ...user, balance: user.balance - match.entryFee };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Refresh match data
      await fetchMatch();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

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
      fetchMatch();
      
      // Poll for match updates every 3 seconds for real-time updates
      const pollInterval = setInterval(() => {
        fetchMatch();
      }, 3000);

      return () => clearInterval(pollInterval);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router, resolvedParams.id]);

  // Early safety checks
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Match Not Found</h1>
          <p className="text-gray-600 mb-4">The match you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isPlayer = user && (match?.player1?._id === user.id || match?.player2?._id === user.id);
  const canJoin = match && match.status === 'waiting' && !match.player2 && !isPlayer;
  const canSubmitResult = match && (match.status === 'active' || match.status === 'in-progress') && isPlayer && !resultSubmitted;

  // Add error boundary wrapper
  try {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <button
                  onClick={() => router.back()}
                  className="mr-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Match Details</h1>
              </div>
              <div className="text-sm text-gray-600">
                Balance: ₹{user?.balance || 0}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Match Info */}
          <div className="bg-white text-black shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Match #{match?._id?.slice(-6) || 'Unknown'}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                match?.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                match?.status === 'active' || match?.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                match?.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {match?.status?.charAt(0)?.toUpperCase() + match?.status?.slice(1) || 'Unknown'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Entry Fee:</span>
                <span className="ml-2 text-black font-medium">₹{match?.entryFee || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Prize Pool:</span>
                <span className="ml-2 text-black font-medium">₹{match?.pot || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Room Code:</span>
                <span className="ml-2 text-black font-medium">{match?.roomCode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-black font-medium">
                  {match?.createdAt ? new Date(match.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="bg-white text-black shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Players</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{match?.player1?.name || 'Player 1'}</h4>
                  <p className="text-sm text-gray-600">{match?.player1?.phone || 'N/A'}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Player 1</span>
              </div>

              {match?.player2 ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{match.player2.name}</h4>
                    <p className="text-sm text-gray-600">{match.player2.phone}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Player 2</span>
                </div>
              ) : (
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <span className="text-gray-500">Waiting for second player...</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-600">{error}</div>
            </div>
          )}

          {canJoin && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Join Match</h3>
              <p className="text-gray-600 mb-4">
                You can join this match for ₹{match?.entryFee || 0} coins. Your current balance: ₹{user?.balance || 0} coins.
              </p>
              <button
                onClick={handleJoinMatch}
                disabled={!user || !match || user.balance < match.entryFee}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Match (₹{match?.entryFee || 0} coins)
              </button>
            </div>
          )}

          {canSubmitResult && match && user && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Result</h3>
              <p className="text-gray-600 mb-4">
                Have you completed the match? Please submit your result honestly.
              </p>
              
              {/* Screenshot Upload for Win Claims */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Screenshot Proof (Required for claiming victory)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {proofPreview ? (
                      <div className="mb-4">
                        <img
                          src={proofPreview}
                          alt="Proof screenshot"
                          className="mx-auto h-32 w-auto rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProofShot(null);
                            setProofPreview(null);
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="proof-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload a screenshot</span>
                            <input
                              id="proof-upload"
                              name="proof-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  📸 Upload a clear screenshot showing your victory screen to claim the win
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => handleSubmitResult('win')}
                  disabled={submittingResult || !match || !user || !proofShot}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!proofShot ? 'Screenshot proof required to claim victory' : ''}
                >
                  {submittingResult ? 'Submitting...' : 'I Won'}
                </button>
                <button
                  onClick={() => handleSubmitResult('loss')}
                  disabled={submittingResult || !match || !user}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingResult ? 'Submitting...' : 'I Lost'}
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={submittingResult}
                  className="bg-amber-300 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
             Game Cancellation
                </button>
              </div>

              {/* Cancel Game Option */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                
                <p className="text-xs text-gray-500 mt-1">
                  Having issues? Request cancellation with proof for admin review
                </p>
              </div>
            </div>
          )}

          {match && match.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-green-800 mb-2">Match Completed</h3>
              <p className="text-green-700">
                Winner: <strong>
                  {(() => {
                    try {
                      // Ensure we have user data before proceeding
                      if (!user) {
                        return 'Loading...';
                      }

                      // Check if user won using isWinner flag (most reliable)
                      if (typeof match.isWinner === 'boolean') {
                        if (match.isWinner) {
                          return 'You';
                        } else {
                          // User lost, try to get opponent name
                          if (match.opponent && typeof match.opponent === 'object' && match.opponent.name) {
                            return match.opponent.name;
                          }
                          return 'Opponent';
                        }
                      }
                      
                      // Safe access to winner name with deep null checking
                      if (match.winner && 
                          typeof match.winner === 'object' && 
                          match.winner !== null && 
                          'name' in match.winner && 
                          match.winner.name) {
                        return match.winner.name;
                      }
                      
                      // If winner exists but no name, try to determine by ID comparison
                      if (match.winner && user && user.id) {
                        try {
                          // Handle different winner formats (string ID or object with _id)
                          let winnerId = '';
                          if (typeof match.winner === 'string') {
                            winnerId = match.winner;
                          } else if (typeof match.winner === 'object' && match.winner !== null) {
                            winnerId = String(match.winner._id || '');
                          }
                          
                          if (winnerId && winnerId === user.id) {
                            return 'You';
                          } else if (winnerId) {
                            return 'Opponent';
                          }
                        } catch (idError) {
                          console.error('Error comparing winner ID:', idError);
                        }
                      }
                      
                      return 'Unknown';
                    } catch (error) {
                      console.error('Error determining winner:', error);
                      return 'Unknown';
                    }
                  })()}
                </strong>
              </p>
              <p className="text-sm text-green-600 mt-1">
                Completed on: {match.completedAt ? new Date(match.completedAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) : new Date().toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {match.isWinner && match.userPayout && (
                <p className="text-green-700 font-medium mt-2">
                  🎉 You won ₹{match.userPayout}!
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push('/match/history')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Match History
            </button>
          </div>
        </main>
        </div>
        
        {/* Cancel Game Modal */}
        <CancelGameModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          matchId={match?._id || ''}
          onSuccess={() => {
            showToast('success', 'Cancel request submitted successfully');
            fetchMatch(); // Refresh match data
          }}
        />
      </>
    );
  } catch (renderError) {
    console.error('Render error in MatchPage:', renderError);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">Unable to display match details</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
}
