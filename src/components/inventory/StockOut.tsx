import React, { useState } from 'react';
import { ArrowUpFromLine, CheckCircle2, AlertCircle, Package, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StockOut: React.FC = () => {
  const { products, stockOut, setActiveTab, t } = useApp();

  const [productId, setProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('Damaged goods write-off');
  const [reference, setReference] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedProduct = products.find(p => p.id === productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!productId) {
      setErrorMsg('Please select a product.');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Quantity removed must be greater than zero.');
      return;
    }
    if (selectedProduct && quantity > selectedProduct.stock) {
      setErrorMsg(`Cannot remove ${quantity} units. Only ${selectedProduct.stock} available in stock.`);
      return;
    }

    const res = stockOut(productId, Number(quantity), reason, reference);
    if (res.success) {
      setSuccessMsg(`Successfully deducted -${quantity} units from ${selectedProduct?.name}!`);
      setQuantity(1);
      setReference('');
    } else {
      setErrorMsg(res.error || 'Failed to adjust stock.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowUpFromLine className="w-6 h-6 text-rose-600" />
            {t.stockOut} (Stock Adjustment & Removal)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Deduct damaged, expired, internal sample, or return items with auditable reason logs.
          </p>
        </div>

        <button 
          onClick={() => setActiveTab('stock_movements')}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <span>View Ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Product *</label>
          <select 
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/30 outline-none font-semibold text-slate-900"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Available: {p.stock} {p.unit}) — SKU: {p.sku}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Currently Available in Warehouse:</span>
            <span className={`font-black text-sm px-2.5 py-0.5 rounded-full ${
              selectedProduct.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {selectedProduct.stock} {selectedProduct.unit}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Remove *</label>
            <input 
              type="number"
              min="1"
              max={selectedProduct?.stock || 1}
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/30 outline-none font-bold text-rose-600 text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Adjustment *</label>
            <select 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/30 outline-none"
            >
              <option value="Damaged goods write-off">Damaged / Broken in transit</option>
              <option value="Expired or spoiled chocolate">Expired / Quality rejection</option>
              <option value="Customer sample / Marketing gift">Customer Gift / Marketing Sample</option>
              <option value="Physical count correction">Audit / Stock count adjustment</option>
              <option value="Internal showroom display">Showroom display usage</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Reference / Incident Note (Optional)</label>
          <input 
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. INCIDENT-REP-09 or Warehouse audit code"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/30 outline-none"
          />
        </div>

        <div className="pt-2">
          <button 
            type="submit"
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            <span>Confirm Stock Out & Log Audit Movement</span>
          </button>
        </div>

      </form>

    </div>
  );
};
