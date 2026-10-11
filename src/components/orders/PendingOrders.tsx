import React, { useMemo } from 'react';
import { Clock, CheckCircle2, XCircle, Printer, AlertTriangle, Eye, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatLocalDateTime, formatLocalDate } from '../../utils/dateUtils';

export const PendingOrders: React.FC = () => {
  const { orders, updateOrderStatus, openInvoiceModal, setActiveTab, t } = useApp();

  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.orderStatus === 'pending');
  }, [orders]);

  const handleConfirm = (orderId: string) => {
    const res = updateOrderStatus(orderId, 'confirmed');
    if (!res.success) {
      alert(res.error || 'Failed to confirm order.');
    }
  };

  const handleCancel = (orderId: string) => {
    const reason = prompt('Enter reason for cancellation:') || 'Pending order rejected';
    updateOrderStatus(orderId, 'cancelled', reason);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500" />
            {t.pendingOrders} Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Orders placed on hold. Confirming will deduct live warehouse stock and prepare for dispatch.
          </p>
        </div>

        <button 
          onClick={() => setActiveTab('new_order')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newOrder}</span>
        </button>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">All Orders Fulfilled!</h3>
          <p className="text-xs text-slate-500 mt-1">There are no pending orders in the queue right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingOrders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border-2 border-amber-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 block">{order.id}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {order.createdAtLocal || formatLocalDateTime(order.createdAt)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Pending Confirmation
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800">{order.customerName}</h4>
                  <p className="text-xs text-slate-500 font-mono">{order.customerPhone}</p>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-1">📍 {order.deliveryAddress}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <p className="font-semibold text-slate-700">Scheduled: {formatLocalDate(order.deliveryDate)} ({order.deliverySlot})</p>
                  <p className="text-slate-500">Items: {order.items.length} products</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold">
                    <span>Order Total:</span>
                    <span className="text-slate-900 text-sm">৳{order.grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {order.deliveryInstructions && (
                  <p className="text-[11px] text-amber-700 bg-amber-50/80 p-2 rounded-lg border border-amber-100">
                    Note: {order.deliveryInstructions}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button 
                  onClick={() => openInvoiceModal(order)}
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleCancel(order.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleConfirm(order.id)}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Deduct Stock</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
