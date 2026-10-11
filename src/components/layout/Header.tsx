import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Plus, Globe, Bell, 
  Menu, LogOut, ChevronDown, CheckCircle2, AlertCircle,
  Package, ShoppingCart, User, ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
  openAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ setMobileOpen, openAuthModal }) => {
  const { 
    currentUser, 
    language, 
    setLanguage, 
    t, 
    setActiveTab, 
    customers,
    products,
    orders,
    auditLogs,
    openInvoiceModal,
    syncStatus,
    settings
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter global search results across customers, products, and orders
  const filteredProducts = searchQuery.trim() 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (Boolean(p.sku) && p.sku!.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 4)
    : [];

  const filteredOrders = searchQuery.trim()
    ? orders.filter(o => 
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerPhone.includes(searchQuery)
      ).slice(0, 4)
    : [];

  const filteredCustomers = searchQuery.trim()
    ? customers.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.phone.includes(searchQuery)
      ).slice(0, 4)
    : [];

  const hasAnyResults = filteredProducts.length > 0 || filteredOrders.length > 0 || filteredCustomers.length > 0;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-xs">
      
      {/* Left side: Hamburger & Brand Badge */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand indicator with official Gift City Logo (Desktop & Mobile) */}
        <div className="flex items-center gap-2.5">
          <img 
            src={settings.logo || '/gift_city_logo.jpg'} 
            alt={settings.companyName || "Gift City"} 
            className="h-8 sm:h-9 w-auto max-w-[110px] sm:max-w-[130px] object-contain shrink-0"
            crossOrigin="anonymous"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/gift_city_logo.jpg';
            }}
          />
          <div className="hidden sm:block">
            <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight block leading-tight">
              {settings.companyName || 'Gift City'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {settings.tagline || 'Choose The Best'}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 text-[#4F35F5] border border-purple-200 flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F35F5] animate-pulse"></span>
            {settings.tagline || t.tagline}
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-md mx-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F35F5]/30 focus:border-[#4F35F5] transition-all"
          />
        </div>

        {/* Global Search Dropdown Results */}
        {showSearchResults && searchQuery.trim().length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto p-2">
            {!hasAnyResults ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No matching products, orders, or customers found for "{searchQuery}".
              </div>
            ) : (
              <div className="space-y-3">
                {/* Products */}
                {filteredProducts.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-indigo-500" /> {t.products}
                    </p>
                    <div className="space-y-1 mt-0.5">
                      {filteredProducts.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => {
                            setActiveTab('products');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{p.name}</span>
                            <span className="text-slate-400 ml-2">SKU: {p.sku}</span>
                          </div>
                          <span className="font-bold text-[#4F35F5]">৳{p.sellingPrice.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orders */}
                {filteredOrders.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" /> {t.orders}
                    </p>
                    <div className="space-y-1 mt-0.5">
                      {filteredOrders.map(o => (
                        <div 
                          key={o.id}
                          onClick={() => {
                            openInvoiceModal(o);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{o.id}</span>
                            <span className="text-slate-500 ml-2">{o.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              o.orderStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                              o.orderStatus === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {o.orderStatus}
                            </span>
                            <span className="font-bold text-slate-800">৳{o.grandTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customers */}
                {filteredCustomers.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-500" /> {t.customers}
                    </p>
                    <div className="space-y-1 mt-0.5">
                      {filteredCustomers.map(c => (
                        <div 
                          key={c.id}
                          onClick={() => {
                            setActiveTab('customers');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{c.name}</span>
                            <span className="text-slate-400 ml-2">{c.phone}</span>
                          </div>
                          <span className="text-slate-500">{c.totalOrders} orders</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Language Switch */}
        <button 
          onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600" />
          <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
        </button>



        {/* Live Multi-Device Sync Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
          <span className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500 animate-spin' : syncStatus === 'offline' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></span>
          <span>{syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'offline' ? 'Offline' : 'Live Sync'}</span>
        </div>
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 relative transition-colors"
            title={t.notifications}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t.notifications}</h4>
                <span className="text-[10px] text-indigo-600 font-semibold">Live Feed</span>
              </div>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {auditLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="font-medium text-slate-800">{log.details}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>{log.userName}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* New Order Primary CTA */}
        <button 
          onClick={() => setActiveTab('new_order')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#4F35F5] hover:bg-[#432dd4] rounded-lg shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t.newOrder}</span>
        </button>

        {/* User Profile Dropdown */}
        <div ref={userRef} className="relative pl-1 border-l border-slate-200">
          <button 
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-7 h-7 rounded-full object-cover border border-slate-300"
            />
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 font-medium capitalize">{currentUser.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2">
              <div className="p-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {currentUser.role}
                </span>
              </div>
              <div className="pt-1">
                <button 
                  onClick={() => {
                    openAuthModal();
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Switch Role / User
                </button>
                <button 
                  onClick={() => {
                    openAuthModal();
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t.signOut}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
