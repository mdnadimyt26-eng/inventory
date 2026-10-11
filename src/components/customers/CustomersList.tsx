import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Plus, Edit3, Trash2, Phone, 
  MapPin, ShoppingCart, DollarSign, Download, 
  ExternalLink, Clock, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, Order } from '../../types';
import { formatLocalDateTime } from '../../utils/dateUtils';

export const CustomersList: React.FC = () => {
  const { customers, orders, addCustomer, updateCustomer, deleteCustomer, setActiveTab, openInvoiceModal, t, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Customer form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Selected customer for viewing order history drawer
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchAddr = c.address.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchAddr) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [customers, searchQuery]);

  // Orders for history customer
  const customerOrders = useMemo(() => {
    if (!historyCustomer) return [];
    return orders.filter(o => o.customerId === historyCustomer.id || o.customerPhone === historyCustomer.phone);
  }, [orders, historyCustomer]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setEmail('');
    setNotes('');
    setFormError(null);
  };

  const openEditModal = (cust: Customer) => {
    setModalMode('edit');
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone);
    setAddress(cust.address);
    setEmail(cust.email || '');
    setNotes(cust.notes || '');
    setFormError(null);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Customer name is required.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Phone number is required.');
      return;
    }

    // Check duplicate phone number
    if (modalMode === 'add') {
      const duplicate = customers.find(c => c.phone.trim() === phone.trim());
      if (duplicate) {
        if (!confirm(`A customer with phone number "${phone}" already exists (${duplicate.name}). Would you like to proceed and save anyway?`)) {
          return;
        }
      }

      const res = addCustomer({
        name,
        phone,
        address,
        email,
        notes,
      });

      if (res.success) {
        setModalMode(null);
      } else {
        setFormError(res.error || 'Failed to add customer.');
      }
    } else if (modalMode === 'edit' && editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name,
        phone,
        address,
        email,
        notes,
      });
      setModalMode(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Address', 'Email', 'Total Orders', 'Total Spent (BDT)', 'Due Balance (BDT)', 'Created At'];
    const rows = filteredCustomers.map(c => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.address}"`,
      `"${c.email || ''}"`,
      c.totalOrders,
      c.totalSpent,
      c.dueBalance,
      c.createdAt.split('T')[0]
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Gift_City_Customers_${new Date().toISOString().split('T')[0]}.csv`);
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
            <Users className="w-6 h-6 text-[#4F35F5]" />
            {t.customers} Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage customer accounts, purchase histories, lifetime spending, and outstanding dues
          </p>
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
            <span>{t.addCustomer}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, phone, or address..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Delivery Address</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4">Lifetime Spent</th>
                <th className="py-3 px-4">Outstanding Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No customers found matching search query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {cust.name}
                      <p className="text-[10px] text-slate-400 font-normal">
                        Added: {formatLocalDateTime(cust.createdAt)}
                      </p>
                      {cust.email && <p className="text-[11px] text-slate-400 font-normal">{cust.email}</p>}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                      {cust.phone}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate">
                      {cust.address}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {cust.totalOrders}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-[#4F35F5]">
                      ৳{cust.totalSpent.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {cust.dueBalance > 0 ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          ৳{cust.dueBalance.toLocaleString()} Due
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full">
                          Clean (৳0)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Order History */}
                        <button 
                          onClick={() => setHistoryCustomer(cust)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                          title="View Order History"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>History</span>
                        </button>

                        {/* Edit */}
                        <button 
                          onClick={() => openEditModal(cust)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Customer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        {currentUser.role === 'admin' && (
                          <button 
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${cust.name}?`)) {
                                deleteCustomer(cust.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER ORDER HISTORY DRAWER */}
      {historyCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{historyCustomer.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{historyCustomer.phone}</p>
                </div>
                <button 
                  onClick={() => setHistoryCustomer(null)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* Customer Stats Cards */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block">Total Orders</span>
                  <span className="font-extrabold text-slate-900 text-sm">{historyCustomer.totalOrders}</span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <span className="text-indigo-600 block">Total Spent</span>
                  <span className="font-extrabold text-indigo-700 text-sm">৳{historyCustomer.totalSpent.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-amber-700 block">Current Due</span>
                  <span className="font-extrabold text-amber-700 text-sm">৳{historyCustomer.dueBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Order List */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Purchase History</h4>
                {customerOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No orders recorded for this customer yet.</p>
                ) : (
                  customerOrders.map(o => (
                    <div key={o.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900">{o.id}</span>
                        <span className="text-[#4F35F5]">৳{o.grandTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>{o.createdAtLocal || formatLocalDateTime(o.createdAt)}</span>
                        <span className={`px-2 py-0.2 rounded-full uppercase font-bold text-[10px] ${
                          o.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          o.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.orderStatus}
                        </span>
                      </div>
                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">{o.items.length} items ordered</span>
                        <button 
                          onClick={() => {
                            openInvoiceModal(o);
                            setHistoryCustomer(null);
                          }}
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          View Invoice →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button 
                onClick={() => {
                  setHistoryCustomer(null);
                  setActiveTab('new_order');
                }}
                className="w-full py-2.5 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-xl shadow-xs"
              >
                + Create New Order for {historyCustomer.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CUSTOMER MODAL */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#4F35F5]" />
              {modalMode === 'add' ? t.addCustomer : 'Edit Customer Information'}
            </h3>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Hassan"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input 
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Address</label>
                <input 
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, Road, Area, City"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferences / Notes</label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. VIP client, prefers morning delivery..."
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
                  Save Customer
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
