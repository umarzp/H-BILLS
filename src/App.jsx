import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';

import { Dashboard } from './components/Dashboard';
import { BillingPOS } from './components/BillingPOS';
import { Inventory } from './components/Inventory';
import { Products } from './components/Products';
import { Customers } from './components/Customers';
import { Suppliers } from './components/Suppliers';
import { Payments } from './components/Payments';
import { Reports } from './components/Reports';
import { SettingsBackup } from './components/SettingsBackup';

const AppContent = () => {
  const { activeTab } = useApp();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'billing':
        return <BillingPOS />;
      case 'inventory':
        return <Inventory />;
      case 'products':
        return <Products />;
      case 'customers':
        return <Customers />;
      case 'suppliers':
        return <Suppliers />;
      case 'payments':
        return <Payments />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <SettingsBackup />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-body">
        <Sidebar />
        <main className="content-area">
          {renderTabContent()}
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
