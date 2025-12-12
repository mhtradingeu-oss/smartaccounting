import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import { RoleProvider } from './context/RoleContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import BankStatements from './pages/BankStatements';
import Billing from './pages/Billing';
import Pricing from './pages/Pricing';

// Simple NotFound page
function NotFound() {
  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>404 - Page Not Found</h1>
      <p style={{ color: '#888', marginTop: '1rem' }}>The page you are looking for does not exist.</p>
    </div>
  );
}

import './index.css';


import { useAuth } from './context/AuthContext';

function App() {
  // Get user from AuthContext
  const { user } = useAuth();
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RoleProvider user={user}>
          <Router>
            <Routes>
              {/* Public route */}
              <Route path="/pricing" element={<Pricing />} />
              {/* Protected routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/invoices" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Invoices />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/bank-statements" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BankStatements />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/billing" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Billing />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              {/* Catch all route: show NotFound */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </RoleProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
