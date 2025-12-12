
import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '../lib/logger';
import { authAPI } from '../services/authAPI';

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

      const response = await authAPI.me();
      const payload = response.data || response;
      if (payload.success) {
        setUser(payload.user);
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
      const response = await authAPI.login({ email, password });
      const payload = response.data || response;

      if (payload.success) {
        const { token, user } = payload;
        localStorage.setItem('token', token);
        setUser(user);
        setIsAuthenticated(true);
        logger.info('Login successful');
        return { success: true };
      }
      
      return { success: false, error: payload.message };
    } catch (error) {
      logger.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Login failed', 
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
