'use client';

import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead } = useNotifications();

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

  const getNotificationBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50';
    
    switch (type) {
      case 'match_result':
        return 'bg-yellow-50 border-l-4 border-l-yellow-500';
      case 'referral_bonus':
        return 'bg-green-50 border-l-4 border-l-green-500';
      case 'wallet_update':
        return 'bg-blue-50 border-l-4 border-l-blue-500';
      case 'match_joined':
        return 'bg-purple-50 border-l-4 border-l-purple-500';
      default:
        return 'bg-gray-50 border-l-4 border-l-gray-500';
    }
  };

  const handleMarkAllRead = () => {
    markAsRead();
  };

  const handleMarkSingleRead = (notificationId: string) => {
    markAsRead([notificationId]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Notification Panel */}
      <div className="fixed inset-x-0 top-0 bottom-0 bg-white z-50 flex flex-col max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="text-6xl mb-4">🔕</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-500 text-sm">
                When you have new notifications, they'll appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 transition-colors ${getNotificationBgColor(notification.type, notification.read)}`}
                  onClick={() => !notification.read && handleMarkSingleRead(notification._id)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Notification Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          {/* Additional Data */}
                          {notification.data?.amount && (
                            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              +₹{notification.data.amount}
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>

                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
