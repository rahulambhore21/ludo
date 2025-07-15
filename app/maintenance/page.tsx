'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MaintenanceInfo {
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  estimatedEndTime?: string;
}

export default function MaintenancePage() {
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo>({
    isMaintenanceMode: true,
    maintenanceMessage: 'System is under maintenance. Please try again later.',
  });

  useEffect(() => {
    fetchMaintenanceStatus();
    
    // Check every 30 seconds if maintenance is over
    const interval = setInterval(fetchMaintenanceStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await fetch('/api/maintenance-status');
      if (response.ok) {
        const data = await response.json();
        setMaintenanceInfo(data);
        
        // If maintenance is over, redirect to home
        if (!data.isMaintenanceMode) {
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    }
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 text-white/10 animate-float">
          <span className="text-6xl">🔧</span>
        </div>
        <div className="absolute top-32 right-32 text-white/10 animate-float-delay">
          <span className="text-4xl">⚙️</span>
        </div>
        <div className="absolute bottom-20 left-32 text-white/10 animate-float">
          <span className="text-5xl">🛠️</span>
        </div>
        <div className="absolute bottom-32 right-20 text-white/10 animate-float-delay">
          <span className="text-3xl">🔨</span>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full">
          {/* Maintenance Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <span className="text-3xl text-white">🔧</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              System Maintenance
            </h1>

            {/* Message */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              {maintenanceInfo.maintenanceMessage}
            </p>

            {/* Estimated Time */}
            {maintenanceInfo.estimatedEndTime && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium">
                  Estimated completion time:
                </p>
                <p className="text-blue-900 font-semibold">
                  {new Date(maintenanceInfo.estimatedEndTime).toLocaleString()}
                </p>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">Checking status...</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={fetchMaintenanceStatus}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Check Status
              </button>
              
              <Link
                href="/"
                className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Go to Homepage
              </Link>
            </div>

            {/* Footer */}
            <p className="text-xs text-gray-400 mt-6">
              We apologize for any inconvenience and appreciate your patience.
            </p>
          </div>

          {/* Contact Info */}
          <div className="mt-6 text-center">
            <p className="text-white/80 text-sm">
              Need help? Contact our support team
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delay {
          animation: float 6s ease-in-out infinite;
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
