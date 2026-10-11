import React, { useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Package, Users, 
  ArrowDownRight, ArrowUpRight, Download, Calendar, 
  Printer, DollarSign, Filter, PieChart as PieIcon 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { useApp } from '../../context/AppContext';

export const ReportsPage: React.FC = () => {
  const { orders, products, customers, financeEntries, t } = useApp();

  const [activeReport, setActiveReport] = useState<'sales' | 'inventory' | 'customer' | 'income' | 'expense'>('sales');
  
  // Date range filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // 1. Sales Report calculations
  const salesMetrics = useMemo(() => {
    const rangeOrders = orders.filter(o => {
      const orderDate = o.createdAt.split('T')[0];
      return orderDate >= startDate && orderDate <= endDate && o.orderStatus !== 'cancelled';
    });

    const totalRevenue = rangeOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalDiscount = rangeOrders.reduce((sum, o) => sum + o.discount, 0);
    const totalShipping = rangeOrders.reduce((sum, o) => sum + (o.shippingCost || 0), 0);
    const totalOrdersCount = rangeOrders.length;
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

    return { totalRevenue, totalDiscount, totalShipping, totalOrdersCount, avgOrderValue, rangeOrders };
  }, [orders, startDate, endDate]);

  // 2. Inventory Metrics
  const inventoryMetrics = useMemo(() => {
    const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValuationCost = products.reduce((sum, p) => sum + (p.unitCost * p.stock), 0);
    const totalValuationRetail = products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
    const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0);
    const outOfStockItems = products.filter(p => p.stock === 0);

    return { totalUnits, totalValuationCost, totalValuationRetail, lowStockItems, outOfStockItems };
  }, [products]);

  // 3. Finance breakdown by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    financeEntries
      .filter(f => f.type === 'expense' && f.date >= startDate && f.date <= endDate)
      .forEach(f => {
        map[f.category] = (map[f.category] || 0) + f.amount;
      });

    return Object.entries(map).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value,
    })).sort((a, b) => b.value - a.value);
  }, [financeEntries, startDate, endDate]);

  const COLORS = ['#4F35F5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6'];

  const handleExportCSV = () => {
    if (activeReport === 'sales') {
      const headers = ['Order ID', 'Date', 'Customer', 'Items Count', 'Subtotal', 'Discount', 'Shipping', 'Grand Total', 'Status'];
      const rows = salesMetrics.rangeOrders.map(o => [
        o.id,
        o.createdAt.split('T')[0],
        `"${o.customerName}"`,
        o.items.length,
        o.subtotal,
        o.discount,
        o.shippingCost,
        o.grandTotal,
        o.orderStatus
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csv));
      link.setAttribute('download', `Sales_Report_${startDate}_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (activeReport === 'inventory') {
      const headers = ['Product', 'SKU', 'Category', 'Stock', 'Unit Cost', 'Selling Price', 'Total Cost Valuation'];
      const rows = products.map(p => [
        `"${p.name}"`,
        p.sku,
        `"${p.category}"`,
        p.stock,
        p.unitCost,
        p.sellingPrice,
        p.unitCost * p.stock
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csv));
      link.setAttribute('download', `Inventory_Valuation_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#4F35F5]" />
            {t.reportsAndAnalytics}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Audit-grade performance metrics, inventory valuation, and category expense analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-xl shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCSV}</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs & Date Range Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveReport('sales')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeReport === 'sales' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.salesReport}
          </button>

          <button
            onClick={() => setActiveReport('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeReport === 'inventory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.inventoryReport}
          </button>

          <button
            onClick={() => setActiveReport('expense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeReport === 'expense' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.expenseReport}
          </button>
        </div>

        {/* Date Filter Inputs */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400">Date Range:</span>
          <input 
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-800 outline-none"
          />
          <span className="text-slate-400">to</span>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-800 outline-none"
          />
        </div>

      </div>

      {/* SALES REPORT VIEW */}
      {activeReport === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400">Period Sales Revenue</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">৳{salesMetrics.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400">Total Orders Processed</span>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">{salesMetrics.totalOrdersCount}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400">Average Order Value (AOV)</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">৳{salesMetrics.avgOrderValue.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400">Total Discounts Granted</span>
              <h3 className="text-2xl font-black text-rose-600 mt-1">৳{salesMetrics.totalDiscount.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-sm">
              Sales Transaction Details ({startDate} to {endDate})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items Count</th>
                    <th className="py-3 px-4">Subtotal</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesMetrics.rangeOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{o.id}</td>
                      <td className="py-3 px-4 text-slate-600">{o.createdAt.split('T')[0]}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{o.customerName}</td>
                      <td className="py-3 px-4">{o.items.length}</td>
                      <td className="py-3 px-4">৳{o.subtotal.toLocaleString()}</td>
                      <td className="py-3 px-4 text-rose-600">-৳{o.discount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-[#4F35F5]">
                        ৳{o.grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY REPORT VIEW */}
      {activeReport === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400">Total Physical Units</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{inventoryMetrics.totalUnits.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400">Total Cost Valuation</span>
              <h3 className="text-2xl font-black text-amber-600 mt-1">৳{inventoryMetrics.totalValuationCost.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400">Retail Sales Potential</span>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">৳{inventoryMetrics.totalValuationRetail.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400">Low Stock SKUs</span>
              <h3 className="text-2xl font-black text-rose-600 mt-1">{inventoryMetrics.lowStockItems.length}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-sm">
              Stock Valuation by Product
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">In Stock</th>
                    <th className="py-3 px-4">Unit Cost</th>
                    <th className="py-3 px-4">Selling Price</th>
                    <th className="py-3 px-4 text-right">Cost Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.sku}</td>
                      <td className="py-3 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3 px-4 text-center font-extrabold text-slate-900">{p.stock} {p.unit}</td>
                      <td className="py-3 px-4">৳{p.unitCost.toLocaleString()}</td>
                      <td className="py-3 px-4 text-indigo-600 font-bold">৳{p.sellingPrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        ৳{(p.unitCost * p.stock).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSE REPORT VIEW */}
      {activeReport === 'expense' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Expense breakdown chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Expenses by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} fontSize={10} stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `৳${val}`} />
                    <Tooltip formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="value" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense breakdown category list */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Category Spending Summary</h3>
              <div className="space-y-2">
                {expenseByCategory.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="font-bold text-slate-800 capitalize">{item.name}</span>
                    </div>
                    <span className="font-extrabold text-rose-600">৳{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
