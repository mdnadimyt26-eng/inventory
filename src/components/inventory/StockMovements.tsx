import React, { useState, useMemo } from 'react';
import { History, Search, Download, ArrowDownToLine, ArrowUpFromLine, RefreshCw, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StockMovements: React.FC = () => {
  const { stockMovements, products, t } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');

  const filteredMovements = useMemo(() => {
    return stockMovements.filter(m => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      if (productFilter !== 'all' && m.productId !== productFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchProd = m.productName.toLowerCase().includes(q) || (Boolean(m.sku) && m.sku!.toLowerCase().includes(q));
        const matchRef = m.reference?.toLowerCase().includes(q);
        const matchReason = m.reason.toLowerCase().includes(q);
        const matchUser = m.recordedByName.toLowerCase().includes(q);
        if (!matchProd && !matchRef && !matchReason && !matchUser) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [stockMovements, typeFilter, productFilter, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Product', 'SKU', 'Movement Type', 'Qty In', 'Qty Out', 'Previous Stock', 'New Stock', 'Reference', 'Reason', 'Recorded By'];
    const rows = filteredMovements.map(m => [
      m.createdAt,
      `"${m.productName}"`,
      m.sku,
      m.type,
      m.quantityIn,
      m.quantityOut,
      m.previousStock,
      m.newStock,
      `"${m.reference || ''}"`,
      `"${m.reason.replace(/"/g, '""')}"`,
      `"${m.recordedByName}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Stock_Movements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-[#4F35F5]" />
            {t.stockMovements} (Inventory Audit Ledger)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Immutable transaction records of all inventory deductions, replenishments, cancellations, and physical adjustments.
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.exportCSV}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product, SKU, reference, or reason..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Movement Type Filter */}
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none text-slate-700"
          >
            <option value="all">All Movement Types</option>
            <option value="stock_in">Stock In (Replenish)</option>
            <option value="order_deduct">Order Deduct (Sale)</option>
            <option value="order_restore">Order Restore (Cancelled)</option>
            <option value="stock_out">Stock Out (Write-off)</option>
          </select>

          {/* Product Filter */}
          <select 
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none text-slate-700 max-w-[200px]"
          >
            <option value="all">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Change Qty</th>
                <th className="py-3 px-4 text-center">Prev → New Stock</th>
                <th className="py-3 px-4">Reference / Reason</th>
                <th className="py-3 px-4 text-right">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No stock movements found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{m.productName}</p>
                      {m.sku && <p className="text-[10px] text-slate-400 font-mono">{m.sku}</p>}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        m.type === 'stock_in' ? 'bg-emerald-100 text-emerald-800' :
                        m.type === 'order_deduct' ? 'bg-indigo-100 text-indigo-800' :
                        m.type === 'order_restore' ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.type === 'stock_in' && <ArrowDownToLine className="w-3 h-3" />}
                        {m.type === 'stock_out' && <ArrowUpFromLine className="w-3 h-3" />}
                        {m.type.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-extrabold whitespace-nowrap">
                      {m.quantityIn > 0 ? (
                        <span className="text-emerald-600">+{m.quantityIn}</span>
                      ) : (
                        <span className="text-rose-600">-{m.quantityOut}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-medium text-slate-600 whitespace-nowrap">
                      <span className="text-slate-400">{m.previousStock}</span>
                      <span className="mx-1 text-slate-300">→</span>
                      <span className="font-bold text-slate-800">{m.newStock}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{m.reason}</p>
                      {m.reference && (
                        <p className="text-[10px] font-mono text-slate-400">Ref: {m.reference}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-600 whitespace-nowrap">
                      {m.recordedByName}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
