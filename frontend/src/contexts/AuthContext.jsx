import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await authService.getMe();
          setUser(response.data);
        } catch (err) {
          // Token is invalid or expired, clear it
          console.debug('[AuthContext] Failed to verify token, clearing authentication');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      } else {
        // No token available, user is not authenticated
        console.debug('[AuthContext] No token found in localStorage, user is unauthenticated');
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await authService.login(username, password);
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setUser(userData);
      
      return userData;
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const updateProfile = async (data) => {
    try {
      setError(null);
      const response = await authService.updateProfile(data);
      setUser({ ...user, ...response.data });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Update failed';
      setError(message);
      throw err;
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      setError(null);
      await authService.changePassword(oldPassword, newPassword);
      return true;
    } catch (err) {
      const message = err.response?.data?.detail || 'Password change failed';
      setError(message);
      throw err;
    }
  };

  const setAuthUser = (userData) => {
    console.debug('[AuthContext] setAuthUser() called with user:', userData?.username);
    setUser(userData);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateProfile,
    changePassword,
    setAuthUser,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
    isEditor: user?.is_editor || false,
    isContributor: user?.is_contributor || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

