import React, { useState } from 'react';
import { ArrowDownToLine, CheckCircle2, AlertCircle, Package, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StockIn: React.FC = () => {
  const { products, stockIn, setActiveTab, t, currentUser } = useApp();

  const [productId, setProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(products[0]?.unitCost || 0);
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('Supplier shipment received');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedProduct = products.find(p => p.id === productId);

  const handleProductChange = (id: string) => {
    setProductId(id);
    const p = products.find(prod => prod.id === id);
    if (p) {
      setUnitCost(p.unitCost);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!productId) {
      setErrorMsg('Please select a product.');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    const res = stockIn(productId, Number(quantity), Number(unitCost), reference, reason);
    if (res.success) {
      setSuccessMsg(`Successfully added +${quantity} units to ${selectedProduct?.name}!`);
      setQuantity(10);
      setReference('');
    } else {
      setErrorMsg(res.error || 'Failed to replenish stock.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowDownToLine className="w-6 h-6 text-emerald-600" />
            {t.stockIn} (Inventory Replenishment)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Receive incoming vendor stock and update warehouse inventory records atomically.
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
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none font-semibold text-slate-900"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Current Stock: {p.stock} {p.unit}) — SKU: {p.sku}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <span className="text-slate-400 block">Current Stock</span>
              <span className="font-extrabold text-slate-900 text-sm">{selectedProduct.stock} {selectedProduct.unit}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Current Cost</span>
              <span className="font-extrabold text-slate-900 text-sm">৳{selectedProduct.unitCost}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Selling Price</span>
              <span className="font-extrabold text-indigo-600 text-sm">৳{selectedProduct.sellingPrice}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Received *</label>
            <input 
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none font-bold text-emerald-700 text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Batch Unit Cost (৳)</label>
            <input 
              type="number"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none font-semibold text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / PO Reference</label>
          <input 
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. PO-SUPPLY-OCT-09"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Stock In Reason / Note</label>
          <input 
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Vendor shipment arrival / Factory replenishment"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none"
          />
        </div>

        <div className="pt-2">
          <button 
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Confirm Stock In & Update Inventory</span>
          </button>
        </div>

      </form>

    </div>
  );
};
