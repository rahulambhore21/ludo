'use client';

import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export default function NotificationTestPanel() {
  const { showToast, refreshNotifications } = useNotifications();

  const testNotifications = [
    {
      type: 'success' as const,
      message: 'Match won! You earned ₹500 🎉',
      icon: '🏆'
    },
    {
      type: 'info' as const,
      message: 'New referral bonus: ₹100 added to wallet',
      icon: '💰'
    },
    {
      type: 'success' as const,
      message: 'Withdrawal approved! ₹1000 transferred',
      icon: '💸'
    },
    {
      type: 'error' as const,
      message: 'Insufficient balance to join match',
      icon: '⚠️'
    },
    {
      type: 'info' as const,
      message: 'Someone joined your match! Game starting...',
      icon: '🎮'
    },
  ];

  const handleTestToast = (type: 'success' | 'error' | 'info', message: string) => {
    showToast(type, message);
  };

  const handleRefreshNotifications = () => {
    refreshNotifications();
    showToast('info', 'Notifications refreshed! 🔄');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">🧪 Test Notifications</h3>
        <button
          onClick={handleRefreshNotifications}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-2">
        {testNotifications.map((notification, index) => (
          <button
            key={index}
            onClick={() => handleTestToast(notification.type, notification.message)}
            className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
          >
            <span className="mr-2">{notification.icon}</span>
            {notification.message}
          </button>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Click buttons to test toast notifications
        </p>
      </div>
    </div>
  );
}
