'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CancelGameModal from '@/components/CancelGameModal';

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
  
  // Cancel game functionality
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Screenshot proof for "I Won"
  const [winProofScreenshot, setWinProofScreenshot] = useState<File | null>(null);
  const [winProofPreview, setWinProofPreview] = useState<string | null>(null);
  
  const router = useRouter();

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

  const handleSubmitResult = async (result: 'win' | 'loss') => {
    if (!match || !user) return;

    // For win results, require screenshot proof
    if (result === 'win' && !winProofScreenshot) {
      setError('Screenshot proof is required when claiming a win');
      return;
    }

    setSubmittingResult(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      
      // Use FormData if screenshot is required (for win)
      if (result === 'win' && winProofScreenshot) {
        const formData = new FormData();
        formData.append('result', result);
        formData.append('screenshot', winProofScreenshot);

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
        
        // Clear screenshot after successful submission
        setWinProofScreenshot(null);
        setWinProofPreview(null);
      } else {
        // For loss results, use JSON
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
      }
      
      // Refresh match data
      await fetchMatch();

      // Update user balance if won
      if (result === 'win') {
        const updatedUser = { ...user, balance: user.balance + (match.pot * 0.9) }; // 90% of pot (minus 10% platform cut)
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit result');
    } finally {
      setSubmittingResult(false);
    }
  };

  const handleCancelRequest = async (reason: string, screenshot: File) => {
    if (!match) return;

    setCancelLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('matchId', match._id);
      formData.append('reason', reason);
      formData.append('screenshot', screenshot);

      const response = await fetch('/api/match/cancel-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit cancel request');
      }

      // Show success message and refresh match
      setError('');
      alert('Cancel request submitted successfully. You will be notified when it is reviewed.');
      await fetchMatch();

    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to submit cancel request');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleWinProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file for win proof');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setWinProofScreenshot(file);
      setError('');

      // Create preview URL
      const url = URL.createObjectURL(file);
      setWinProofPreview(url);
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
          <div className="bg-white shadow rounded-lg p-6 mb-6">
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
                <span className="ml-2 font-medium">₹{match?.entryFee || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Prize Pool:</span>
                <span className="ml-2 font-medium">₹{match?.pot || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Room Code:</span>
                <span className="ml-2 font-medium">{match?.roomCode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 font-medium">
                  {match?.createdAt ? new Date(match.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
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
              
              {/* Screenshot Proof for "I Won" */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 className="font-medium text-yellow-800 mb-2">📸 Screenshot Proof Required for Win Claims</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  To claim a win, you must upload a screenshot of the completed game as proof.
                </p>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleWinProofChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                {winProofPreview && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <img
                      src={winProofPreview}
                      alt="Win proof preview"
                      className="max-w-full h-32 object-contain border border-gray-300 rounded"
                    />
                  </div>
                )}
              </div>

              <p className="text-gray-600 mb-4">
                Have you completed the match? Please submit your result honestly.
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => handleSubmitResult('win')}
                  disabled={submittingResult || !match || !user || !winProofScreenshot}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submittingResult ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>🏆 I Won</span>
                      {!winProofScreenshot && <span className="text-xs">(Screenshot Required)</span>}
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleSubmitResult('loss')}
                  disabled={submittingResult || !match || !user}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingResult ? 'Submitting...' : '😞 I Lost'}
                </button>
              </div>
            </div>
          )}

          {/* Cancel Game Option - Only show if match is not completed */}
          {isPlayer && match && match.status !== 'completed' && match.status !== 'cancelled' && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Need to Cancel?</h3>
              <p className="text-gray-600 mb-4">
                If you're unable to complete this match due to technical issues or other problems, 
                you can request cancellation. Admins will review your request.
              </p>
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md font-medium flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Request Cancellation</span>
              </button>
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
