
import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '../lib/logger';
import api from '../services/api';

// Create the AuthContext
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      logger.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        setIsAuthenticated(true);
        logger.info('Login successful');
        return { success: true };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      logger.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed', 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    logger.info('User logged out');
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default export
export default AuthContext;
