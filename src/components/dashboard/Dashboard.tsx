import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, ShoppingCart, DollarSign, ArrowDownRight, 
  ArrowUpRight, Users, AlertTriangle, ShieldCheck, 
  Plus, ArrowRight, Clock,
  Package, CheckCircle2, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatLocalDateTime, formatLocalDate } from '../../utils/dateUtils';

export const Dashboard: React.FC = () => {
  const { 
    currentUser, 
    orders, 
    products, 
    customers, 
    financeEntries, 
    t, 
    setActiveTab, 
    openInvoiceModal,
    settings
  } = useApp();

  const [incomeExpensePeriod, setIncomeExpensePeriod] = useState<'7days' | '30days' | 'all'>('7days');

  // Compute Today's date in local Asia/Dhaka string YYYY-MM-DD
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Real KPI calculations from the actual database
  const kpiData = useMemo(() => {
    const todayOrdersList = orders.filter(o => o.createdAt.startsWith(todayStr));
    const todaySales = todayOrdersList.reduce((acc, o) => acc + (o.orderStatus !== 'cancelled' ? o.grandTotal : 0), 0);
    const todayOrdersCount = todayOrdersList.length;

    const todayIncomeList = financeEntries.filter(f => f.type === 'income' && f.date === todayStr);
    const todayIncome = todayIncomeList.reduce((acc, f) => acc + f.amount, 0);

    const todayExpenseList = financeEntries.filter(f => f.type === 'expense' && f.date === todayStr);
    const todayExpense = todayExpenseList.reduce((acc, f) => acc + f.amount, 0);

    // Calculate COGS for today's orders
    const todayCOGS = todayOrdersList.reduce((acc, o) => {
      if (o.orderStatus === 'cancelled') return acc;
      return acc + o.items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
    }, 0);

    // Today's Gross Profit = Today's Sales - COGS
    // Net Profit = (Today's Sales - COGS) - Today's Operating Expenses
    const todayGrossProfit = todaySales - todayCOGS;
    const todayNetProfit = todayGrossProfit - todayExpense;

    const totalCustomersCount = customers.length;
    const totalOrdersCount = orders.length;

    const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold);

    return {
      todaySales,
      todayOrdersCount,
      todayIncome,
      todayExpense,
      todayNetProfit,
      totalCustomersCount,
      totalOrdersCount,
      lowStockCount: lowStockItems.length,
      lowStockItems,
    };
  }, [orders, financeEntries, customers, products, todayStr]);

  // Weekly Sales Velocity (Past 7 Days)
  const weeklySalesData = useMemo(() => {
    const days: { date: string; label: string; sales: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

      const dayOrders = orders.filter(o => o.createdAt.startsWith(dateString) && o.orderStatus !== 'cancelled');
      const sales = dayOrders.reduce((sum, o) => sum + o.grandTotal, 0);

      days.push({
        date: dateString,
        label: dayLabel,
        sales,
        count: dayOrders.length
      });
    }
    return days;
  }, [orders]);

  // Income vs Expense Chart Data
  const incomeVsExpenseData = useMemo(() => {
    const daysCount = incomeExpensePeriod === '7days' ? 7 : incomeExpensePeriod === '30days' ? 14 : 30;
    const result: { label: string; income: number; expense: number }[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const inc = financeEntries
        .filter(f => f.type === 'income' && f.date === dateString)
        .reduce((sum, f) => sum + f.amount, 0);

      const exp = financeEntries
        .filter(f => f.type === 'expense' && f.date === dateString)
        .reduce((sum, f) => sum + f.amount, 0);

      result.push({ label, income: inc, expense: exp });
    }
    return result;
  }, [financeEntries, incomeExpensePeriod]);

  // Recent 5 orders
  const recentOrders = useMemo(() => {
    return [...orders].slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. WELCOME HERO BANNER (Matching Reference 1) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#10192F] via-[#1E1B4B] to-[#4F35F5] p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 border border-indigo-900/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="bg-white px-2.5 py-1 rounded-xl shadow-md shrink-0 flex items-center justify-center">
              <img 
                src={settings.logo || '/gift_city_logo.jpg'} 
                alt={settings.companyName || "Gift City"} 
                className="w-14 sm:w-16 h-auto max-h-14 object-contain rounded-lg"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/gift_city_logo.jpg';
                }}
              />
            </div>
            <div className="space-y-2">
              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.productionReady} • Live Sync Engine</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {settings.companyName || 'Gift City'} {t.operationalDashboard}
              </h1>
              
              <p className="text-indigo-200 text-sm font-medium leading-relaxed">
                Welcome back, <strong className="text-white">{currentUser.name}</strong> ({currentUser.role.toUpperCase()}). 
                {settings.address && <span className="block text-xs text-indigo-300/80 mt-1">📍 {settings.address}</span>}
              </p>
            </div>
          </div>

          {/* Banner Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">


            <button 
              onClick={() => setActiveTab('orders')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all active:scale-95"
            >
              <ShoppingCart className="w-4 h-4 text-indigo-300" />
              <span>{t.viewOrders}</span>
            </button>

            <button 
              onClick={() => setActiveTab('new_order')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4F35F5] hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/40 transition-all active:scale-95 border border-indigo-400/40"
            >
              <Plus className="w-4 h-4" />
              <span>{t.createOrder}</span>
            </button>
          </div>
        </div>

        {/* Ambient subtle decorative lights */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -bottom-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* 2. KPI CARDS (8 dynamic cards matching Reference Image 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.todaySales}</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4F35F5] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              ৳{kpiData.todaySales.toLocaleString()}
            </h3>
            <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
              <span>{kpiData.todayOrdersCount} confirmed sales</span>
            </p>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.todayOrders}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpiData.todayOrdersCount} <span className="text-sm font-semibold text-slate-400">Orders</span>
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              {orders.filter(o => o.createdAt.startsWith(todayStr) && o.orderStatus === 'pending').length} pending fulfillment
            </p>
          </div>
        </div>

        {/* Today's Income */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.todayIncome}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-600 tracking-tight">
              ৳{kpiData.todayIncome.toLocaleString()}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Cash & digital collections
            </p>
          </div>
        </div>

        {/* Today's Expense */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.todayExpense}</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-rose-600 tracking-tight">
              ৳{kpiData.todayExpense.toLocaleString()}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Operating costs logged
            </p>
          </div>
        </div>

        {/* Today's Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.todayProfit}</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#4F35F5] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${kpiData.todayNetProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              ৳{kpiData.todayNetProfit.toLocaleString()}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Sales − COGS − Expenses
            </p>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.totalCustomers}</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpiData.totalCustomersCount}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Active buyer directory
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.totalOrders}</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpiData.totalOrdersCount}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Lifetime sales orders
            </p>
          </div>
        </div>

        {/* Needs Restock / Low Stock Warning */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setActiveTab('products')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">{t.needsRestock}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-amber-700 tracking-tight flex items-center gap-1.5">
              {kpiData.lowStockCount} <span className="text-xs font-bold text-amber-600 uppercase">Items</span>
            </h3>
            <p className="text-[11px] font-medium text-amber-700/80 mt-1">
              Below threshold • Click to restock
            </p>
          </div>
        </div>

      </div>



      {/* 4. CHARTS SECTION (Weekly Sales Velocity & Income vs Expense) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Sales Velocity Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">{t.weeklySalesVelocity}</h3>
              <p className="text-xs text-slate-400 font-medium">{t.revenueTrend}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                Past 7 Days
              </span>
            </div>
          </div>
          
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesVelocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F35F5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4F35F5" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `৳${val}`} />
                <Tooltip 
                  formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, 'Sales Revenue']}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#4F35F5" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#salesVelocityGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs. Expense Comparison Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">{t.incomeVsExpense}</h3>
              <p className="text-xs text-slate-400 font-medium">{t.financialOverview}</p>
            </div>
            
            {/* Period Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button 
                onClick={() => setIncomeExpensePeriod('7days')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  incomeExpensePeriod === '7days' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                7 Days
              </button>
              <button 
                onClick={() => setIncomeExpensePeriod('30days')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  incomeExpensePeriod === '30days' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                14 Days
              </button>
              <button 
                onClick={() => setIncomeExpensePeriod('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  incomeExpensePeriod === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `৳${val}`} />
                <Tooltip 
                  formatter={(val: any) => [`৳${Number(val).toLocaleString()}`]}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="income" name="Collections (Income)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Operational Expense" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 5. RECENT ACTIVITY & QUICK ORDERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Recent Customer Orders</h3>
            <p className="text-xs text-slate-400 font-medium">Latest sales processed in the system</p>
          </div>
          <button 
            onClick={() => setActiveTab('orders')}
            className="text-xs font-bold text-[#4F35F5] hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Delivery Date</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No orders recorded yet. Create an order to get started!
                  </td>
                </tr>
              ) : (
                recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {order.id}
                    <p className="text-[10px] text-slate-400 font-normal">
                      {order.createdAtLocal || formatLocalDateTime(order.createdAt)}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{order.customerName}</p>
                    <p className="text-[11px] text-slate-400">{order.customerPhone}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{formatLocalDate(order.deliveryDate)}</td>
                  <td className="py-3 px-4 text-slate-600">{order.items.length} items</td>
                  <td className="py-3 px-4 font-bold text-slate-900">৳{order.grandTotal.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                      order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      order.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                      order.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                      order.orderStatus === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button 
                      onClick={() => openInvoiceModal(order)}
                      className="px-2.5 py-1 text-xs font-semibold text-[#4F35F5] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Invoice
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
