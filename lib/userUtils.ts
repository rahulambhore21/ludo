// Utility functions for user balance and data management

export const refreshUserBalance = async (): Promise<{ balance: number } | null> => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    const response = await fetch('/api/user/balance', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    
    // Update localStorage with fresh user data
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return { balance: data.user.balance };
  } catch (error) {
    console.error('Error refreshing user balance:', error);
    return null;
  }
};

export const getUserFromStorage = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data from storage:', error);
    return null;
  }
};

export const updateUserInStorage = (updatedFields: Partial<any>) => {
  try {
    const currentUser = getUserFromStorage();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    }
    return null;
  } catch (error) {
    console.error('Error updating user in storage:', error);
    return null;
  }
};
