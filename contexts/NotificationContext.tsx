'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  type: 'match_result' | 'referral_bonus' | 'wallet_update' | 'match_joined';
  title: string;
  message: string;
  data?: {
    matchId?: string;
    amount?: number;
    transactionId?: string;
    referralUserId?: string;
  };
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationIds?: string[]) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationIds?: string[]) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        // Update local state
        if (notificationIds) {
          setNotifications(prev => 
            prev.map(notif => 
              notificationIds.includes(notif._id) 
                ? { ...notif, read: true }
                : notif
            )
          );
          setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
        } else {
          // Mark all as read
          setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    switch (type) {
      case 'success':
        toast.success(message, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#10b981',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#10b981',
          },
        });
        break;
      case 'error':
        toast.error(message, {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#ef4444',
          },
        });
        break;
      case 'info':
        toast(message, {
          duration: 4000,
          position: 'top-center',
          icon: '💰',
          style: {
            background: '#3b82f6',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
          },
        });
        break;
    }
  };

  const refreshNotifications = () => {
    fetchNotifications();
  };

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      showToast,
      refreshNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
