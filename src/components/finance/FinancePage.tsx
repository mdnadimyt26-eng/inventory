import React, { useState, useMemo } from 'react';
import { 
  Wallet, ArrowDownRight, ArrowUpRight, Plus, 
  Search, Filter, Calendar, Download, Trash2, 
  DollarSign, FileText, PieChart, CheckCircle2, 
  ChevronRight, AlertCircle, TrendingUp, Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FinanceEntry, FinanceType, PaymentMethod } from '../../types';

export const FinancePage: React.FC = () => {
  const { 
    financeEntries, 
    orders, 
    addFinanceEntry, 
    deleteFinanceEntry, 
    t, 
    currentUser,
    activeSubTab
  } = useApp();

  // Active top tab: 'all' | 'income' | 'expense' | 'summary'
  const [selectedTab, setSelectedTab] = useState<'all' | 'income' | 'expense' | 'summary'>(
    activeSubTab === 'income' ? 'income' :
    activeSubTab === 'expense' ? 'expense' :
    activeSubTab === 'summary' ? 'summary' : 'all'
  );

  // Category filter chip
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Search query & Payment method filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  // Modals for adding income / expense
  const [showAddModal, setShowAddModal] = useState<FinanceType | null>(null);
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCategory, setFormCategory] = useState<string>('product_cost');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('cash');
  const [formReference, setFormReference] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Category chips definition matching Reference Image 3
  const categoryChips = [
    { key: 'all', label: t.allCategories },
    { key: 'product_cost', label: t.productCost },
    { key: 'delivery_charge', label: t.deliveryCharge },
    { key: 'shop_rent', label: t.shopRent },
    { key: 'home_rent', label: t.homeRent },
    { key: 'packaging_cost', label: t.packagingCost },
    { key: 'ads_cost', label: t.adsCost },
    { key: 'utilities_internet', label: t.utilitiesInternet },
    { key: 'employee_salary', label: t.employeeSalary },
    { key: 'employee_ta_da', label: t.employeeTADA },
  ];

  // Filtered ledger records
  const filteredEntries = useMemo(() => {
    return financeEntries.filter(entry => {
      // Tab filter
      if (selectedTab === 'income' && entry.type !== 'income') return false;
      if (selectedTab === 'expense' && entry.type !== 'expense') return false;

      // Category chip filter
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) return false;

      // Payment method filter
      if (selectedMethod !== 'all' && entry.paymentMethod !== selectedMethod) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = entry.description.toLowerCase().includes(q);
        const matchRef = entry.reference?.toLowerCase().includes(q);
        const matchUser = entry.recordedByName.toLowerCase().includes(q);
        const matchCat = entry.category.toLowerCase().includes(q);
        if (!matchDesc && !matchRef && !matchUser && !matchCat) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [financeEntries, selectedTab, selectedCategory, selectedMethod, searchQuery]);

  // Real Accounting Summary Calculations
  const accountingSummary = useMemo(() => {
    // 1. Total Sales Revenue from confirmed/delivered orders
    const confirmedOrders = orders.filter(o => o.orderStatus !== 'cancelled');
    const totalSalesRevenue = confirmedOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    // 2. Total Collections (Cash & Digital collections from all income entries)
    const totalCollections = financeEntries
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0);

    // 3. Accounts Receivable (Unpaid dues from customer orders)
    const totalReceivables = confirmedOrders.reduce((sum, o) => sum + o.dueBalance, 0);

    // 4. Cost of Goods Sold (COGS) based on product cost snapshots in order line items
    const cogs = confirmedOrders.reduce((acc, o) => {
      return acc + o.items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
    }, 0);

    // 5. Total Operating Expenses (excluding direct COGS if already entered separately)
    const totalExpenses = financeEntries
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);

    // 6. Gross Profit = Sales Revenue − COGS
    const grossProfit = totalSalesRevenue - cogs;

    // 7. Net Profit = Gross Profit − Total Operating Expenses
    const netProfit = grossProfit - totalExpenses;

    return {
      totalSalesRevenue,
      totalCollections,
      totalReceivables,
      cogs,
      totalExpenses,
      grossProfit,
      netProfit,
    };
  }, [orders, financeEntries]);

  // Handle Add Entry Form Submit
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formAmount <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Please enter a description or explanation for this ledger entry.');
      return;
    }

    const res = addFinanceEntry({
      type: showAddModal!,
      category: formCategory,
      amount: Number(formAmount),
      paymentMethod: formMethod,
      reference: formReference,
      description: formDescription,
      date: formDate,
      notes: formNotes,
    });

    if (res.success) {
      setShowAddModal(null);
      setFormAmount(0);
      setFormDescription('');
      setFormReference('');
      setFormNotes('');
    } else {
      setFormError(res.error || 'Failed to save entry.');
    }
  };

  // Export Filtered Table to CSV
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Type', 'Category', 'Payment Method', 'Reference', 'Description', 'Recorded By', 'Amount (BDT)'];
    const rows = filteredEntries.map(e => [
      e.createdAt,
      e.type,
      e.category,
      e.paymentMethod,
      `"${e.reference || ''}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.recordedByName}"`,
      e.amount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gift_City_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* 1. HEADER (Matching Reference Image 3) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#4F35F5]" />
            {t.financeTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {t.financeSubtitle}
          </p>
        </div>

        {/* Action Buttons: Add Income & Add Expense */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setShowAddModal('income');
              setFormCategory('order_sale');
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>{t.addIncome}</span>
          </button>

          <button 
            onClick={() => {
              setShowAddModal('expense');
              setFormCategory('product_cost');
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{t.addExpense}</span>
          </button>
        </div>
      </div>

      {/* 2. TOP TABS: Summary, Income, Expense, All Ledger */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-1 overflow-x-auto">
        <button
          onClick={() => setSelectedTab('all')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            selectedTab === 'all' 
              ? 'border-[#4F35F5] text-[#4F35F5]' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t.allLedgerTab}</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
            {financeEntries.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedTab('income')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            selectedTab === 'income' 
              ? 'border-emerald-600 text-emerald-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>{t.incomeTab}</span>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
            {financeEntries.filter(f => f.type === 'income').length}
          </span>
        </button>

        <button
          onClick={() => setSelectedTab('expense')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            selectedTab === 'expense' 
              ? 'border-rose-600 text-rose-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>{t.expenseTab}</span>
          <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-semibold">
            {financeEntries.filter(f => f.type === 'expense').length}
          </span>
        </button>

        <button
          onClick={() => setSelectedTab('summary')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            selectedTab === 'summary' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>{t.summaryTab}</span>
        </button>
      </div>

      {/* 3. ACCOUNT SUMMARY VIEW (When Summary tab is active) */}
      {selectedTab === 'summary' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Sales Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">{t.totalSalesRevenue}</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
                ৳{accountingSummary.totalSalesRevenue.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Confirmed orders gross value</p>
            </div>

            {/* COGS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">{t.costOfGoodsSold}</span>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-2">
                ৳{accountingSummary.cogs.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Direct product inventory cost</p>
            </div>

            {/* Gross Profit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">{t.grossProfit}</span>
              <h3 className={`text-2xl font-extrabold mt-2 ${accountingSummary.grossProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                ৳{accountingSummary.grossProfit.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">{t.grossProfitFormula}</p>
            </div>

            {/* Net Profit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs bg-gradient-to-br from-indigo-50/50 to-purple-50/30">
              <span className="text-xs font-semibold text-indigo-700">{t.netProfit}</span>
              <h3 className={`text-2xl font-extrabold mt-2 ${accountingSummary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ৳{accountingSummary.netProfit.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">{t.netProfitFormula}</p>
            </div>

          </div>

          {/* Cashflow & Receivables Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700">{t.totalCollections}</span>
              <h4 className="text-xl font-bold text-emerald-600 mt-1">
                ৳{accountingSummary.totalCollections.toLocaleString()}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Actual collected cash & bank inflows</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-rose-700">{t.totalExpenses}</span>
              <h4 className="text-xl font-bold text-rose-600 mt-1">
                ৳{accountingSummary.totalExpenses.toLocaleString()}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Rent, ads, logistics & payroll</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-amber-700">{t.totalReceivables}</span>
              <h4 className="text-xl font-bold text-amber-600 mt-1">
                ৳{accountingSummary.totalReceivables.toLocaleString()}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Customer outstanding unpaid orders</p>
            </div>
          </div>

          {/* Accounting Methodology explanation card */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Strict Accounting Integrity Rules Active:</p>
              <p>1. Order collections are recorded in the cashflow ledger exactly once at order creation or installment recording.</p>
              <p>2. Sales revenue reflects verified customer invoices, while Cost of Goods Sold (COGS) snapshots unit costs at checkout.</p>
              <p>3. Net profit distinguishes between physical product costs and operational overhead (rent, marketing, salaries).</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 4. EXPENSE CATEGORY FILTER CHIPS (Matching Reference Image 3) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categoryChips.map(chip => {
              const count = chip.key === 'all' 
                ? financeEntries.length 
                : financeEntries.filter(f => f.category === chip.key).length;

              const isSelected = selectedCategory === chip.key;

              return (
                <button
                  key={chip.key}
                  onClick={() => setSelectedCategory(chip.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border ${
                    isSelected 
                      ? 'bg-[#10192F] text-white border-[#10192F] shadow-xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{chip.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 5. SEARCH & FILTER BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reference, description, category or recorded by..."
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>

              <select 
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none text-slate-700"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
              </select>
            </div>

            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportCSV}</span>
            </button>
          </div>

          {/* 6. LEDGER TABLE (Matching Reference Image 3) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">{t.timestamp}</th>
                    <th className="py-3 px-4">{t.type}</th>
                    <th className="py-3 px-4">{t.category}</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">{t.reference}</th>
                    <th className="py-3 px-4">{t.recordedBy}</th>
                    <th className="py-3 px-4 text-right">{t.amount}</th>
                    <th className="py-3 px-4 text-right">{t.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No financial records found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            entry.type === 'income' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {entry.type === 'income' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {entry.type}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 capitalize">
                            {entry.category.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium capitalize text-[11px]">
                            {entry.paymentMethod.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900">{entry.description}</p>
                          {entry.reference && (
                            <p className="text-[11px] text-slate-400 font-mono">Ref: {entry.reference}</p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {entry.recordedByName}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className={`text-sm font-extrabold ${
                            entry.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {entry.type === 'income' ? '+' : '-'}৳{entry.amount.toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {currentUser.role === 'admin' && (
                            <button 
                              onClick={() => deleteFinanceEntry(entry.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 7. ADD INCOME / EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {showAddModal === 'income' ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                    <span>{t.addIncome}</span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <span>{t.addExpense}</span>
                  </>
                )}
              </h3>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEntry} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (৳) *
                  </label>
                  <input 
                    type="number"
                    min="1"
                    required
                    value={formAmount || ''}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none capitalize"
                  >
                    {showAddModal === 'income' ? (
                      <>
                        <option value="order_sale">{t.orderSale}</option>
                        <option value="service_fee">Service Fee</option>
                        <option value="wholesale_order">Wholesale Order</option>
                        <option value="investment">Capital Investment</option>
                        <option value="other">Other Income</option>
                      </>
                    ) : (
                      <>
                        <option value="product_cost">{t.productCost}</option>
                        <option value="delivery_charge">{t.deliveryCharge}</option>
                        <option value="shop_rent">{t.shopRent}</option>
                        <option value="home_rent">{t.homeRent}</option>
                        <option value="packaging_cost">{t.packagingCost}</option>
                        <option value="ads_cost">{t.adsCost}</option>
                        <option value="utilities_internet">{t.utilitiesInternet}</option>
                        <option value="employee_salary">{t.employeeSalary}</option>
                        <option value="employee_ta_da">{t.employeeTADA}</option>
                        <option value="office_supplies">{t.officeSupplies}</option>
                        <option value="maintenance">{t.maintenance}</option>
                        <option value="other">Other Expense</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select 
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                  >
                    <option value="cash">{t.cash}</option>
                    <option value="bkash">{t.bkash}</option>
                    <option value="nagad">{t.nagad}</option>
                    <option value="bank_transfer">{t.bankTransfer}</option>
                    <option value="card">{t.card}</option>
                    <option value="other">{t.other}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transaction Date
                  </label>
                  <input 
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Purpose *
                </label>
                <input 
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Monthly showroom internet bill payment"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reference / Receipt Number (Optional)
                </label>
                <input 
                  type="text"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  placeholder="e.g. INV-90412 or TrxID"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs ${
                    showAddModal === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Record Entry
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
