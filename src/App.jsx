import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Categories } from './pages/Categories';
import { Invoices } from './pages/Invoices';
import { Spreadsheet } from './pages/Spreadsheet';

function App() {
  return (
    <FinanceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="spreadsheet" element={<Spreadsheet />} />
            <Route path="categories" element={<Categories />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FinanceProvider>
  );
}

export default App;
