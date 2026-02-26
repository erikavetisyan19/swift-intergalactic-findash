import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy loaded page components to reduce initial bundle chunk size
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Transactions = lazy(() => import('./pages/Transactions').then(module => ({ default: module.Transactions })));
const Categories = lazy(() => import('./pages/Categories').then(module => ({ default: module.Categories })));
const Invoices = lazy(() => import('./pages/Invoices').then(module => ({ default: module.Invoices })));
const Spreadsheet = lazy(() => import('./pages/Spreadsheet').then(module => ({ default: module.Spreadsheet })));
const Payroll = lazy(() => import('./pages/Payroll').then(module => ({ default: module.Payroll })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));

function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <BrowserRouter>
          <Suspense fallback={
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
              Loading...
            </div>
          }>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'viewer']}>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<ProtectedRoute allowedRoles={['admin', 'viewer']}><Dashboard /></ProtectedRoute>} />
                <Route path="transactions" element={<ProtectedRoute allowedRoles={['admin', 'viewer']}><Transactions /></ProtectedRoute>} />
                <Route path="invoices" element={<ProtectedRoute allowedRoles={['admin', 'viewer']}><Invoices /></ProtectedRoute>} />
                <Route path="spreadsheet" element={<ProtectedRoute allowedRoles={['admin', 'viewer']}><Spreadsheet /></ProtectedRoute>} />
                <Route path="payroll" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'viewer']}><Payroll /></ProtectedRoute>} />
                <Route path="categories" element={<ProtectedRoute allowedRoles={['admin', 'viewer']}><Categories /></ProtectedRoute>} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </FinanceProvider>
    </AuthProvider>
  );
}

export default App;
