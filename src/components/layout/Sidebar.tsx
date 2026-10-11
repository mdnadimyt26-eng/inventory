import React, { useState } from 'react';
import { 
  LayoutDashboard, ShoppingCart, UserPlus, Users, 
  Package, PackagePlus, ArrowDownToLine, ArrowUpFromLine, 
  History, Wallet, ArrowDownRight, ArrowUpRight, 
  BarChart3, Settings, ShieldCheck, FileText, 
  ChevronDown, ChevronRight, Gift, Menu, X, Clock,
  PieChart, TrendingUp, DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, t, orders, products, currentUser, settings } = useApp();
  
  // Track open/collapsed section menus
  const [salesOpen, setSalesOpen] = useState(true);
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);

  // Counts for badges
  const pendingOrdersCount = orders.filter(o => o.orderStatus === 'pending').length;
  const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const navItemClass = (tabName: string) => `
    flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors
    ${activeTab === tabName 
      ? 'bg-[#4F35F5] text-white shadow-md shadow-[#4F35F5]/30' 
      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#10192F] text-slate-100 flex flex-col
        transition-transform duration-300 ease-in-out border-r border-slate-800
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-[#0c1427]">
          <div className="flex items-center gap-2.5">
            <div className="bg-white p-1 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
              <img 
                src={settings.logo || '/gift_city_logo.jpg'} 
                alt={settings.companyName || "Gift City"} 
                className="h-8 w-8 object-contain"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/gift_city_logo.jpg';
                }}
              />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                {settings.companyName || 'Gift City'}
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-400/30">
                  ERP
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[120px]">{settings.tagline || 'Inventory & POS'}</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar">
          
          {/* Main Dashboard */}
          <div>
            <button 
              onClick={() => handleNav('dashboard')} 
              className={navItemClass('dashboard')}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>{t.dashboard}</span>
              </div>
            </button>
          </div>

          {/* Section: Sales & Orders */}
          <div>
            <button 
              onClick={() => setSalesOpen(!salesOpen)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.salesAndOrders}</span>
              </div>
              {salesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {salesOpen && (
              <div className="mt-1 space-y-1 pl-2">
                <button 
                  onClick={() => handleNav('new_order')} 
                  className={navItemClass('new_order')}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{t.newOrder}</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleNav('customers')} 
                  className={navItemClass('customers')}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{t.customers}</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleNav('orders')} 
                  className={navItemClass('orders')}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className="w-4 h-4 text-slate-400" />
                    <span>{t.orders}</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleNav('pending_orders')} 
                  className={navItemClass('pending_orders')}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{t.pendingOrders}</span>
                  </div>
                  {pendingOrdersCount > 0 && (
                    <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Section: Inventory & Stock */}
          <div>
            <button 
              onClick={() => setInventoryOpen(!inventoryOpen)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.inventoryAndStock}</span>
              </div>
              {inventoryOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {inventoryOpen && (
              <div className="mt-1 space-y-1 pl-2">
                <button 
                  onClick={() => handleNav('products')} 
                  className={navItemClass('products')}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>{t.products}</span>
                  </div>
                  {lowStockCount > 0 && (
                    <span className="text-xs bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                      {lowStockCount}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => handleNav('stock_in')} 
                  className={navItemClass('stock_in')}
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                    <span>{t.stockIn}</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleNav('stock_out')} 
                  className={navItemClass('stock_out')}
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowUpFromLine className="w-4 h-4 text-rose-400" />
                    <span>{t.stockOut}</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleNav('stock_movements')} 
                  className={navItemClass('stock_movements')}
                >
                  <div className="flex items-center gap-2.5">
                    <History className="w-4 h-4 text-slate-400" />
                    <span>{t.stockMovements}</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Section: Finance & Accounts */}
          <div>
            <button 
              onClick={() => setFinanceOpen(!financeOpen)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.financeAndAccounts}</span>
              </div>
              {financeOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {financeOpen && (
              <div className="mt-1 space-y-1 pl-2">
                <button 
                  onClick={() => handleNav('finance_all')} 
                  className={navItemClass('finance_all')}
                >
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <span>{t.allLedgerTab}</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleNav('finance_income')} 
                  className={navItemClass('finance_income')}
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                    <span>{t.income}</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleNav('finance_expense')} 
                  className={navItemClass('finance_expense')}
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowUpRight className="w-4 h-4 text-rose-400" />
                    <span>{t.expense}</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleNav('finance_summary')} 
                  className={navItemClass('finance_summary')}
                >
                  <div className="flex items-center gap-2.5">
                    <PieChart className="w-4 h-4 text-indigo-400" />
                    <span>{t.accountSummary}</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Section: Reports & Analytics */}
          <div>
            <button 
              onClick={() => setReportsOpen(!reportsOpen)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.reportsAndAnalytics}</span>
              </div>
              {reportsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {reportsOpen && (
              <div className="mt-1 space-y-1 pl-2">
                <button 
                  onClick={() => handleNav('reports')} 
                  className={navItemClass('reports')}
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>{t.salesReport}</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Section: System & Admin */}
          <div>
            <button 
              onClick={() => setSystemOpen(!systemOpen)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.system}</span>
              </div>
              {systemOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {systemOpen && (
              <div className="mt-1 space-y-1 pl-2">
                <button 
                  onClick={() => handleNav('settings')} 
                  className={navItemClass('settings')}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>{t.settings}</span>
                  </div>
                </button>

                {currentUser.role === 'admin' && (
                  <>
                    <button 
                      onClick={() => handleNav('user_management')} 
                      className={navItemClass('user_management')}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>{t.userManagement}</span>
                      </div>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    </button>

                    <button 
                      onClick={() => handleNav('audit_logs')} 
                      className={navItemClass('audit_logs')}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>{t.auditLogs}</span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-3 border-t border-slate-800 bg-[#0c1427]">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-9 h-9 rounded-full object-cover border border-slate-600"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[11px] text-indigo-400 font-medium capitalize flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {currentUser.role}
              </p>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
};
