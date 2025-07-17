import { useState, useEffect } from 'react';
import { refreshUserBalance } from './userUtils';

interface User {
  id: string;
  name: string;
  phone: string;
  balance: number;
  isAdmin: boolean;
}

export function useWalletBalance() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Listen for storage changes (when balance is updated from another component)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          setUser(updatedUser);
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Manual refresh function
  const refreshBalance = async () => {
    setLoading(true);
    try {
      const updatedUser = await refreshUserBalance();
      if (updatedUser) {
        setUser(updatedUser);
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('userBalanceUpdated', { 
          detail: updatedUser 
        }));
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for custom balance update events
  useEffect(() => {
    const handleBalanceUpdate = (e: CustomEvent) => {
      setUser(e.detail);
    };

    window.addEventListener('userBalanceUpdated', handleBalanceUpdate as EventListener);
    return () => window.removeEventListener('userBalanceUpdated', handleBalanceUpdate as EventListener);
  }, []);

  return {
    user,
    setUser,
    refreshBalance,
    loading,
  };
}

// Utility function to update user balance from any component
export async function updateUserBalance() {
  try {
    const updatedUser = await refreshUserBalance();
    if (updatedUser) {
      // Dispatch event to notify all components using the hook
      window.dispatchEvent(new CustomEvent('userBalanceUpdated', { 
        detail: updatedUser 
      }));
    }
    return updatedUser;
  } catch (error) {
    console.error('Error updating user balance:', error);
    return null;
  }
}
