import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { refreshToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('expense_tracker_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (err) {
      localStorage.removeItem('expense_tracker_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('expense_tracker_user', JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem('expense_tracker_token', userData.token);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('expense_tracker_user');
    localStorage.removeItem('expense_tracker_token');
    // Force redirect to login
    window.location.href = '/login';
  }, []);

  const isAuthenticated = Boolean(user && user.token);

  const refreshSession = useCallback(async () => {
    try {
      const response = await refreshToken();
      if (response.data) {
        login(response.data);
        console.log('Token refreshed successfully');
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
    }
  }, [login]);

  // Set up auto-refresh interval when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh once on load
    refreshSession();

    // Auto-refresh every 15 minutes
    const interval = setInterval(() => {
      refreshSession();
    }, 900000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshSession]);

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    loading,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
