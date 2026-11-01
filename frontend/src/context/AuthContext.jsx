import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('al_suffa_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('al_suffa_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and check current session
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('al_suffa_token');
      if (storedToken) {
        try {
          const res = await axiosClient.get('/auth/me');
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('al_suffa_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.error('Session verification failed:', err.message);
          setUser(null);
          setToken(null);
          localStorage.removeItem('al_suffa_token');
          localStorage.removeItem('al_suffa_user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await axiosClient.post('/auth/login', { username, password });
    if (res.success && res.data) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('al_suffa_token', newToken);
      localStorage.setItem('al_suffa_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('al_suffa_token');
    localStorage.removeItem('al_suffa_user');
    window.location.href = '/login';
  }, []);

  const refreshUser = async () => {
    try {
      const res = await axiosClient.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('al_suffa_user', JSON.stringify(res.data));
      }
    } catch (_) {}
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user && !!token,
    role: user?.role,
    isAdmin: user?.role === 'admin',
    isAccountant: user?.role === 'accountant',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

