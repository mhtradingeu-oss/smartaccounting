import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const loginDisabled = process.env.REACT_APP_DISABLE_LOGIN === 'true';
  useEffect(() => {
    if (loginDisabled) {
      window.location.href = '/dashboard';
    }
  }, [loginDisabled]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) {setError('');}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await login(formData);

      if (result.success) {
        // Redirect based on user role
        const user = result.user;
        if (user.role === 'admin' || user.role === 'superadmin') {
          navigate('/dashboard');
        } else if (user.role === 'accountant') {
          navigate('/invoices');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loginDisabled) {return null;}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            SmartAccounting
          </h2>
          <div className="mt-2 text-center">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4">
              🧪 TESTING MODE: Authentication Disabled
            </div>
            <p className="text-sm text-gray-600">
              {t('auth.signInToAccount')}
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.email')}
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.password')}
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                t('auth.signIn')
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Demo Credentials:<br />
              Email: gharabli@mhtrading-eu.com<br />
              Password: admin123
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
