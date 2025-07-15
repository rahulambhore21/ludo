'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LegalDocument {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

const legalDocuments: LegalDocument[] = [
  {
    id: 'terms',
    title: 'Terms of Service',
    description: 'Our platform terms and conditions for using the gaming service',
    icon: '📋',
    route: '/legal/terms-of-service'
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect your personal information',
    icon: '🔒',
    route: '/legal/privacy-policy'
  },
  {
    id: 'refund',
    title: 'Refund Policy',
    description: 'Terms and conditions for refunds and cancellations',
    icon: '💰',
    route: '/legal/refund-policy'
  },
  {
    id: 'fair-play',
    title: 'Fair Play Policy',
    description: 'Our commitment to fair gaming and anti-cheating measures',
    icon: '⚖️',
    route: '/legal/fair-play-policy'
  },
  {
    id: 'responsible-gaming',
    title: 'Responsible Gaming',
    description: 'Guidelines for healthy and responsible gaming practices',
    icon: '🎯',
    route: '/legal/responsible-gaming'
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    description: 'Important disclaimers about our platform and services',
    icon: '⚠️',
    route: '/legal/disclaimer'
  }
];

export default function LegalPage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-600 text-white px-4 py-3 text-center">
          <p className="text-sm">You're currently offline. Some content may not be available.</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white text-black shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">🎲 Ludo Battle</span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/match/browse" className="text-gray-700 hover:text-blue-600">
                Play
              </Link>
              <Link href="/legal" className="text-blue-600 font-medium">
                Legal
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Legal Documents
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Important legal information about our platform, your rights, and our policies. 
            Please read these documents carefully to understand how our service works.
          </p>
        </div>

        {/* Legal Documents Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {legalDocuments.map((doc) => (
            <Link
              key={doc.id}
              href={doc.route}
              className="bg-white text-black rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">{doc.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {doc.description}
              </p>
              <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                Read Document
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Important Legal Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  By using our platform, you agree to be bound by these legal documents. 
                  These documents may be updated from time to time, and we will notify you of any significant changes. 
                  Your continued use of the platform constitutes acceptance of the updated terms.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white text-black rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/support"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg mr-3">🆘</span>
              <span className="text-sm font-medium text-gray-700">Support Center</span>
            </Link>
            <Link
              href="/contact"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg mr-3">📞</span>
              <span className="text-sm font-medium text-gray-700">Contact Us</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg mr-3">🏠</span>
              <span className="text-sm font-medium text-gray-700">Dashboard</span>
            </Link>
            <Link
              href="/match/browse"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg mr-3">🎮</span>
              <span className="text-sm font-medium text-gray-700">Play Now</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © 2024 Ludo Battle. All rights reserved. 
              <Link href="/legal" className="ml-2 text-blue-400 hover:text-blue-300">
                Legal Information
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
