import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Categories } from './pages/Categories';
import { Invoices } from './pages/Invoices';
import { Spreadsheet } from './pages/Spreadsheet';
import { Payroll } from './pages/Payroll';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </FinanceProvider>
    </AuthProvider>
  );
}

export default App;
