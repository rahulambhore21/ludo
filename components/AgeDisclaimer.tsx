'use client';

import { useState, useEffect } from 'react';

export default function AgeDisclaimer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged the disclaimer
    const acknowledged = localStorage.getItem('ageDisclaimer');
    if (!acknowledged) {
      setShow(true);
    }
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem('ageDisclaimer', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="mb-4">
            <div className="text-6xl mb-2">🔞</div>
            <h2 className="text-2xl font-bold text-gray-900">Age Verification</h2>
          </div>
          
          <div className="mb-6 text-gray-700">
            <p className="mb-3">
              This is a skill-based gaming platform. You must be 18 years or older to participate.
            </p>
            <p className="text-sm">
              By continuing, you confirm that you are 18+ and understand that this involves real money gaming.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAcknowledge}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              I am 18+ and I understand
            </button>
            
            <button
              onClick={() => window.location.href = 'https://google.com'}
              className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
            >
              I am under 18
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            This platform promotes responsible gaming. 
            <a href="/legal/responsible-gaming" className="underline hover:text-gray-700">
              Learn more
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
