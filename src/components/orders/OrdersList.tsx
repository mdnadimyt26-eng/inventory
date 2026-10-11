import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, Search, Filter, Download, Plus, 
  Printer, CheckCircle2, Clock, XCircle, Truck, 
  DollarSign, ChevronRight, AlertCircle, Eye, RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../../types';
import { formatLocalDateTime, formatLocalDate } from '../../utils/dateUtils';

export const OrdersList: React.FC = () => {
  const { 
    orders, 
    updateOrderStatus, 
    recordOrderPayment, 
    openInvoiceModal, 
    setActiveTab, 
    t, 
    currentUser,
    settings 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  
  // Modals for actions
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentRef, setPaymentRef] = useState('');

  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'all' && order.orderStatus !== statusFilter) return false;
      if (paymentFilter !== 'all' && order.paymentStatus !== paymentFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = order.id.toLowerCase().includes(q);
        const matchCust = order.customerName.toLowerCase().includes(q);
        const matchPhone = order.customerPhone.includes(q) || order.receiverPhone.includes(q);
        const matchItem = order.items.some(i => i.productName.toLowerCase().includes(q) || (Boolean(i.sku) && i.sku!.toLowerCase().includes(q)));
        if (!matchId && !matchCust && !matchPhone && !matchItem) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter, paymentFilter, searchQuery]);

  // Handle Cancel Submit
  const handleConfirmCancel = () => {
    if (!cancelModalOrder) return;
    const res = updateOrderStatus(cancelModalOrder.id, 'cancelled', cancelReason);
    if (res.success) {
      setCancelModalOrder(null);
      setCancelReason('');
    } else {
      alert(res.error || 'Failed to cancel order.');
    }
  };

  // Handle Due Collection Submit
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalOrder || paymentAmount <= 0) return;

    const res = recordOrderPayment(paymentModalOrder.id, paymentAmount, paymentMethod, paymentRef);
    if (res.success) {
      setPaymentModalOrder(null);
      setPaymentAmount(0);
      setPaymentRef('');
    } else {
      alert(res.error || 'Payment recording failed.');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Phone', 'Receiver', 'Delivery Date', 'Items Qty', 'Grand Total', 'Paid', 'Due', 'Status', 'Payment Status', 'Created By'];
    const rows = filteredOrders.map(o => [
      o.id,
      o.createdAt.split('T')[0],
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.receiverName}"`,
      o.deliveryDate,
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.grandTotal,
      o.paidAmount,
      o.dueBalance,
      o.orderStatus,
      o.paymentStatus,
      `"${o.createdByName}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Orders_Export_${new Date().toISOString().split('T')[0]}.csv`);
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
              <ShoppingCart className="w-6 h-6 text-[#4F35F5]" />
              {t.orders} & Invoices Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Real-time sales orders, customer invoice printing, and payment collections
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
            onClick={() => setActiveTab('new_order')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newOrder}</span>
          </button>
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
            placeholder="Search Order ID, customer, phone, or item..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Filter */}
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none text-slate-700"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{t.orderId}</th>
                <th className="py-3 px-4">{t.customer}</th>
                <th className="py-3 px-4">{t.receiver}</th>
                <th className="py-3 px-4">Delivery</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Paid / Due</th>
                <th className="py-3 px-4">{t.status}</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No orders found matching filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Order ID */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {order.id}
                      <p className="text-[11px] text-slate-500 font-medium">
                        {order.createdAtLocal || formatLocalDateTime(order.createdAt)}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{order.customerName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{order.customerPhone}</p>
                    </td>

                    {/* Receiver */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{order.receiverName}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{order.deliveryAddress}</p>
                    </td>

                    {/* Delivery Date & Slot */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-700">{formatLocalDate(order.deliveryDate)}</p>
                      <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {order.deliverySlot}
                      </span>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{order.items.length} items</span>
                      <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {order.items.map(i => i.productName).join(', ')}
                      </p>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                      ৳{order.grandTotal.toLocaleString()}
                    </td>

                    {/* Paid vs Due */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="text-emerald-600 font-bold">Paid: ৳{order.paidAmount.toLocaleString()}</p>
                      {order.dueBalance > 0 ? (
                        <p className="text-amber-600 font-bold text-[11px]">Due: ৳{order.dueBalance.toLocaleString()}</p>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          Settled
                        </span>
                      )}
                    </td>

                    {/* Order Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase inline-block ${
                        order.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        order.orderStatus === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Quick Status Confirm for Pending */}
                        {order.orderStatus === 'pending' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Confirm & Deduct Stock"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Quick Mark Delivered */}
                        {order.orderStatus === 'confirmed' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Mark Delivered"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Record Payment if due */}
                        {order.dueBalance > 0 && order.orderStatus !== 'cancelled' && (
                          <button 
                            onClick={() => {
                              setPaymentModalOrder(order);
                              setPaymentAmount(order.dueBalance);
                            }}
                            className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                            title="Collect Due Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}

                        {/* Invoice print */}
                        <button 
                          onClick={() => openInvoiceModal(order)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* View Details */}
                        <button 
                          onClick={() => setSelectedOrderDetails(order)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Cancel order */}
                        {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                          <button 
                            onClick={() => setCancelModalOrder(order)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Cancel Order"
                          >
                            <XCircle className="w-4 h-4" />
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

      {/* CANCEL ORDER REASON MODAL */}
      {cancelModalOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              Cancel Order {cancelModalOrder.id}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cancelling this order will automatically restore reserved product quantities back into active inventory.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Cancellation</label>
                <input 
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer requested cancellation / Change of mind"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/30 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  onClick={() => setCancelModalOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Keep Order
                </button>
                <button 
                  onClick={handleConfirmCancel}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  Confirm Cancellation & Restore Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COLLECT DUE PAYMENT MODAL */}
      {paymentModalOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Collect Payment — {paymentModalOrder.id}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Outstanding due: <strong className="text-amber-600">৳{paymentModalOrder.dueBalance.toLocaleString()}</strong> for customer {paymentModalOrder.customerName}.
            </p>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Collect (৳) *</label>
                <input 
                  type="number"
                  min="1"
                  max={paymentModalOrder.dueBalance}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Reference</label>
                <input 
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. bKash TrxID"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setPaymentModalOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS DRAWER */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedOrderDetails.id}</h3>
                  <p className="text-xs text-slate-500 font-medium">Created: {selectedOrderDetails.createdAtLocal || formatLocalDateTime(selectedOrderDetails.createdAt)}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* Status & Payment pills */}
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  selectedOrderDetails.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  selectedOrderDetails.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                  selectedOrderDetails.orderStatus === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  Status: {selectedOrderDetails.orderStatus}
                </span>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  selectedOrderDetails.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                  selectedOrderDetails.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  Payment: {selectedOrderDetails.paymentStatus}
                </span>
              </div>

              {/* Line items list */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ordered Products</h4>
                <div className="space-y-1.5">
                  {selectedOrderDetails.items.map(item => (
                    <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity} × ৳{item.unitPrice}</p>
                      </div>
                      <span className="font-extrabold text-slate-900">৳{item.lineTotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary box */}
              <div className="p-4 rounded-xl bg-slate-100 space-y-1 text-xs">
                <div className="flex justify-between"><span>Subtotal:</span><span>৳{selectedOrderDetails.subtotal}</span></div>
                <div className="flex justify-between"><span>Discount:</span><span className="text-rose-600">-৳{selectedOrderDetails.discount}</span></div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total:</span><span>৳{selectedOrderDetails.grandTotal}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Paid:</span><span>৳{selectedOrderDetails.paidAmount}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Due Balance:</span><span>৳{selectedOrderDetails.dueBalance}</span>
                </div>
              </div>

              {/* Shipping info */}
              <div className="text-xs space-y-1 pt-2">
                <p><strong>Customer:</strong> {selectedOrderDetails.customerName} ({selectedOrderDetails.customerPhone})</p>
                <p><strong>Receiver:</strong> {selectedOrderDetails.receiverName} ({selectedOrderDetails.receiverPhone})</p>
                <p><strong>Address:</strong> {selectedOrderDetails.deliveryAddress}</p>
                <p><strong>Schedule:</strong> {selectedOrderDetails.deliveryDate} ({selectedOrderDetails.deliverySlot})</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center gap-2">
              <button 
                onClick={() => {
                  openInvoiceModal(selectedOrderDetails);
                  setSelectedOrderDetails(null);
                }}
                className="w-full py-2.5 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-xl shadow-xs"
              >
                Print Official Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
