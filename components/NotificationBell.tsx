'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationPanel from './NotificationPanel';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    // Check if mobile
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      setShowMobilePanel(true);
    } else {
      setIsOpen(!isOpen);
    }
    
    if (unreadCount > 0) {
      // Mark all notifications as read when opening
      setTimeout(() => markAsRead(), 500);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match_result':
        return '🏆';
      case 'referral_bonus':
        return '💰';
      case 'wallet_update':
        return '💳';
      case 'match_joined':
        return '🎮';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match_result':
        return 'text-yellow-600';
      case 'referral_bonus':
        return 'text-green-600';
      case 'wallet_update':
        return 'text-blue-600';
      case 'match_joined':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        {/* Notification Bell Button */}
        <button
          onClick={handleBellClick}
          className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          {/* Bell Icon */}
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>

          {/* Unread Count Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Desktop Notification Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden hidden md:block">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={() => markAsRead()}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🔕</div>
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Notification Icon */}
                        <div className="flex-shrink-0 mt-1">
                          <span className="text-lg">
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>

                        {/* Notification Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          {/* Additional Data */}
                          {notification.data?.amount && (
                            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              +₹{notification.data.amount}
                            </div>
                          )}
                        </div>

                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div className="flex-shrink-0 mt-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Could navigate to a full notifications page
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Notification Panel */}
      <NotificationPanel 
        isOpen={showMobilePanel} 
        onClose={() => setShowMobilePanel(false)} 
      />
    </>
  );
}
