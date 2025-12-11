import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import BankStatements from './pages/BankStatements';
import GermanTaxReports from './pages/GermanTaxReports';
import Billing from './pages/Billing';
import Pricing from './pages/Pricing';

import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* LOGIN DISABLED: Direct routes to dashboard */}
            <Route path="/pricing" element={<Pricing />} />

            {/* Direct routes - no authentication required */}
            <Route path="/" element={<Dashboard />} />
            {/* <Route path="/login" element={<Login />} /> */}
            <Route 
              path="/dashboard" 
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              } 
            />
            <Route 
              path="/invoices" 
              element={
                <Layout>
                  <Invoices />
                </Layout>
              } 
            />
            <Route 
              path="/bank-statements" 
              element={
                <Layout>
                  <BankStatements />
                </Layout>
              } 
            />
            <Route 
              path="/german-tax" 
              element={
                <Layout>
                  <GermanTaxReports />
                </Layout>
              } 
            />
            <Route 
              path="/billing" 
              element={
                <Layout>
                  <Billing />
                </Layout>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;