import React, { useState, useMemo } from 'react';
import { 
  Package, Search, Plus, Filter, AlertTriangle, 
  Edit3, Trash2, ArrowDownToLine, ArrowUpFromLine, 
  CheckCircle2, DollarSign, Download, Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';

export const ProductsList: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, setActiveTab, t, currentUser, settings } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'instock' | 'out'>('all');

  // Add / Edit Modal
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Perfume & Fragrance');
  const [description, setDescription] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [unit, setUnit] = useState('pcs');
  const [formError, setFormError] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;

      if (stockStatusFilter === 'low' && p.stock > p.lowStockThreshold) return false;
      if (stockStatusFilter === 'out' && p.stock > 0) return false;
      if (stockStatusFilter === 'instock' && p.stock === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        const matchCat = p.category ? p.category.toLowerCase().includes(q) : false;
        if (!matchName && !matchSku && !matchCat) return false;
      }

      return true;
    });
  }, [products, categoryFilter, stockStatusFilter, searchQuery]);

  // Inventory valuation summary
  const valuation = useMemo(() => {
    const totalItemsCount = products.reduce((sum, p) => sum + p.stock, 0);
    const totalCostValuation = products.reduce((sum, p) => sum + (p.unitCost * p.stock), 0);
    const totalRetailValuation = products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
    const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;

    return { totalItemsCount, totalCostValuation, totalRetailValuation, lowStockCount };
  }, [products]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingProduct(null);
    setName('');
    setSku('');
    setCategory('General');
    setDescription('');
    setSellingPrice(1500);
    setUnitCost(900);
    setStock(10);
    setLowStockThreshold(5);
    setUnit('pcs');
    setFormError(null);
  };

  const openEditModal = (prod: Product) => {
    setModalMode('edit');
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku || '');
    setCategory(prod.category || 'General');
    setDescription(prod.description || '');
    setSellingPrice(prod.sellingPrice);
    setUnitCost(prod.unitCost);
    setStock(prod.stock);
    setLowStockThreshold(prod.lowStockThreshold);
    setUnit(prod.unit);
    setFormError(null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    if (sellingPrice < 0 || unitCost < 0) {
      setFormError('Pricing and unit costs cannot be negative.');
      return;
    }

    const finalSku = (editingProduct?.sku || `GC-${Date.now().toString().slice(-6)}`).toUpperCase();
    const finalCategory = editingProduct?.category || 'General';

    if (modalMode === 'add') {
      const res = addProduct({
        name,
        sku: finalSku,
        category: finalCategory,
        description,
        sellingPrice: Number(sellingPrice),
        unitCost: Number(unitCost),
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold),
        unit,
        isActive: true,
      });

      if (res.success) {
        setModalMode(null);
      } else {
        setFormError(res.error || 'Failed to add product.');
      }
    } else if (modalMode === 'edit' && editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        description,
        sellingPrice: Number(sellingPrice),
        unitCost: Number(unitCost),
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold),
        unit,
      });
      setModalMode(null);
    }
  };

  // CSV export
  const handleExportCSV = () => {
    const headers = ['Product Name', 'SKU', 'Category', 'Unit Cost (BDT)', 'Selling Price (BDT)', 'Stock', 'Unit', 'Stock Value (Cost)'];
    const rows = filteredProducts.map(p => [
      `"${p.name}"`,
      p.sku,
      `"${p.category}"`,
      p.unitCost,
      p.sellingPrice,
      p.stock,
      p.unit,
      p.unitCost * p.stock
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Gift_City_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-1 bg-slate-50 border border-slate-200/80 rounded-xl shrink-0 hidden sm:block">
            <img 
              src={settings.logo || "/gift_city_logo.jpg"} 
              alt={settings.companyName || "Gift City"} 
              className="w-10 h-10 object-contain rounded-lg"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/gift_city_logo.jpg';
              }}
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-[#4F35F5]" />
              {t.products} & Inventory Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Manage SKUs, prices, unit costs, stock levels, and replenishment alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCSV}</span>
          </button>
          
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addProduct}</span>
          </button>
        </div>
      </div>

      {/* Valuation Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Total Available Units</span>
          <h3 className="text-xl font-black text-slate-900 mt-1">{valuation.totalItemsCount.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Stock Value (At Cost)</span>
          <h3 className="text-xl font-black text-slate-900 mt-1">৳{valuation.totalCostValuation.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Retail Sales Potential</span>
          <h3 className="text-xl font-black text-indigo-600 mt-1">৳{valuation.totalRetailValuation.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-xs font-semibold text-amber-700">Restock Alerts</span>
          <h3 className="text-xl font-black text-amber-700 mt-1">{valuation.lowStockCount} Products</h3>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product name, SKU, or category..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          {/* Stock Status Filter */}
          <select 
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none text-slate-700"
          >
            <option value="all">All Stock Statuses</option>
            <option value="low">Needs Restock (Low)</option>
            <option value="instock">In Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-4">{t.unitCost}</th>
                <th className="py-3 px-4">{t.sellingPrice}</th>
                <th className="py-3 px-4">{t.inStock}</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const isLowStock = prod.stock <= prod.lowStockThreshold;
                  const isOutOfStock = prod.stock === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {prod.name}
                        {prod.description && (
                          <p className="text-[11px] text-slate-400 font-normal truncate max-w-[220px]">
                            {prod.description}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-semibold">
                        ৳{prod.unitCost.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-[#4F35F5]">
                        ৳{prod.sellingPrice.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          isOutOfStock ? 'bg-rose-100 text-rose-800' :
                          isLowStock ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLowStock && <AlertTriangle className="w-3 h-3" />}
                          {prod.stock} {prod.unit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {prod.lowStockThreshold} {prod.unit}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          {currentUser.role === 'admin' && (
                            <button 
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${prod.name}?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#4F35F5]" />
              {modalMode === 'add' ? t.addProduct : 'Edit Product Details'}
            </h3>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Oud Gift Set"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>



              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost (৳) *</label>
                  <input 
                    type="number"
                    min="0"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (৳) *</label>
                  <input 
                    type="number"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none font-bold text-[#4F35F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock</label>
                  <input 
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alert Threshold</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Type</label>
                  <input 
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs, box, set"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea 
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Material specs, gift notes, fragrance notes..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-xl shadow-xs"
                >
                  Save Product
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
