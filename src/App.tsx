/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { NewOrder } from './components/orders/NewOrder';
import { OrdersList } from './components/orders/OrdersList';
import { PendingOrders } from './components/orders/PendingOrders';
import { InvoiceModal } from './components/orders/InvoiceModal';
import { ProductsList } from './components/inventory/ProductsList';
import { StockIn } from './components/inventory/StockIn';
import { StockOut } from './components/inventory/StockOut';
import { StockMovements } from './components/inventory/StockMovements';
import { CustomersList } from './components/customers/CustomersList';
import { FinancePage } from './components/finance/FinancePage';
import { ReportsPage } from './components/reports/ReportsPage';
import { UserManagement } from './components/system/UserManagement';
import { AuditLogs } from './components/system/AuditLogs';
import { SettingsPage } from './components/system/SettingsModal';
import { AuthModal } from './components/auth/AuthModal';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveSubTab, 
    selectedOrderForInvoice, 
    closeInvoiceModal 
  } = useApp();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Render current active tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'new_order':
        return <NewOrder />;
      case 'orders':
        return <OrdersList />;
      case 'pending_orders':
        return <PendingOrders />;
      case 'products':
      case 'add_product':
        return <ProductsList />;
      case 'stock_in':
        return <StockIn />;
      case 'stock_out':
        return <StockOut />;
      case 'stock_movements':
        return <StockMovements />;
      case 'customers':
      case 'add_customer':
        return <CustomersList />;
      case 'finance_all':
        setActiveSubTab('all');
        return <FinancePage />;
      case 'finance_income':
        setActiveSubTab('income');
        return <FinancePage />;
      case 'finance_expense':
        setActiveSubTab('expense');
        return <FinancePage />;
      case 'finance_summary':
        setActiveSubTab('summary');
        return <FinancePage />;
      case 'finance':
        return <FinancePage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'user_management':
        return <UserManagement />;
      case 'audit_logs':
        return <AuditLogs />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex text-slate-800">
      
      {/* 1. Left Fixed / Collapsible Sidebar */}
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        setMobileOpen={setMobileSidebarOpen} 
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
        
        {/* Top Header */}
        <Header 
          setMobileOpen={setMobileSidebarOpen} 
          openAuthModal={() => setAuthModalOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>

      </div>

      {/* 3. Global Modals */}
      {selectedOrderForInvoice && (
        <InvoiceModal 
          order={selectedOrderForInvoice} 
          onClose={closeInvoiceModal} 
        />
      )}



      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />

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
