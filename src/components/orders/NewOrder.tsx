import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Plus, Trash2, CheckCircle2, Clock, 
  RotateCcw, Printer, ArrowRight, ShieldCheck, 
  AlertCircle, DollarSign, Calendar, MapPin, 
  Phone, Sparkles, ShoppingBag, Search, Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderItem, OrderStatus, PaymentStatus, PaymentMethod, DeliverySlot } from '../../types';
import { getTodayLocalISODate, formatLocalDateTime, getCurrentLocalDateTimeString } from '../../utils/dateUtils';

export const NewOrder: React.FC = () => {
  const { 
    customers, 
    products, 
    createOrder, 
    t, 
    settings, 
    setActiveTab, 
    openInvoiceModal,
    addCustomer,
    addProduct
  } = useApp();

  // Mode: Existing Customer vs Walk-in
  const [customerMode, setCustomerMode] = useState<'existing' | 'walkin'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // Section A: Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Section B: Receiver Details
  const [sameAsCustomer, setSameAsCustomer] = useState(true);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');

  // Section C: Delivery Schedule
  const [deliveryDate, setDeliveryDate] = useState(() => {
    return getTodayLocalISODate();
  });
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot>('anytime');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Section D: Product Line Items
  const [items, setItems] = useState<Array<{
    tempId: string;
    productId: string;
    productName: string;
    sku?: string;
    unitCost: number;
    unitPrice: number;
    quantity: number;
    availableStock: number;
    lineTotal: number;
  }>>([]);

  // Section E: Order Status (Confirmed vs Pending)
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('confirmed');

  // Section F: Discount
  const [discount, setDiscount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);

  // Section G: Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState<string>('');

  // Form feedback state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add Customer Modal
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Quick Add Product Modal
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(1000);
  const [newProdCost, setNewProdCost] = useState(600);
  const [newProdStock, setNewProdStock] = useState(10);

  // When Existing customer is selected from dropdown
  useEffect(() => {
    if (customerMode === 'existing' && selectedCustomerId) {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone);
        setCustomerAddress(cust.address);
      }
    }
  }, [customerMode, selectedCustomerId, customers]);



  // If items are empty on start, add one row with first product
  useEffect(() => {
    if (items.length === 0 && products.length > 0) {
      const firstProd = products[0];
      setItems([{
        tempId: `line-${Date.now()}`,
        productId: firstProd.id,
        productName: firstProd.name,
        sku: firstProd.sku,
        unitCost: firstProd.unitCost,
        unitPrice: firstProd.sellingPrice,
        quantity: 1,
        availableStock: firstProd.stock,
        lineTotal: firstProd.sellingPrice * 1
      }]);
    }
  }, [products]);

  // Calculate Subtotal, Grand Total, and Due
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    const total = subtotal - (Number(discount) || 0);
    return Math.max(0, total);
  }, [subtotal, discount]);

  const dueBalance = useMemo(() => {
    const due = grandTotal - (Number(paidAmount) || 0);
    return Math.max(0, due);
  }, [grandTotal, paidAmount]);

  // Automatically update paid amount if user hasn't typed an explicit partial amount
  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    const target = { ...updated[index] };

    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        target.productId = prod.id;
        target.productName = prod.name;
        target.sku = prod.sku;
        target.unitCost = prod.unitCost;
        target.unitPrice = prod.sellingPrice;
        target.availableStock = prod.stock;
        target.lineTotal = prod.sellingPrice * target.quantity;
      }
    } else if (field === 'quantity') {
      const qty = Math.max(1, parseInt(value) || 1);
      target.quantity = qty;
      target.lineTotal = target.unitPrice * qty;
    } else if (field === 'unitPrice') {
      const price = Math.max(0, parseFloat(value) || 0);
      target.unitPrice = price;
      target.lineTotal = price * target.quantity;
    }

    updated[index] = target;
    setItems(updated);
  };

  const handleAddLineItem = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    setItems(prev => [...prev, {
      tempId: `line-${Date.now()}-${Math.random()}`,
      productId: defaultProd.id,
      productName: defaultProd.name,
      sku: defaultProd.sku,
      unitCost: defaultProd.unitCost,
      unitPrice: defaultProd.sellingPrice,
      quantity: 1,
      availableStock: defaultProd.stock,
      lineTotal: defaultProd.sellingPrice
    }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMessage('Order must have at least one product line item.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Reset Form
  const handleResetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setSelectedCustomerId('');
    setSameAsCustomer(true);
    setReceiverName('');
    setReceiverPhone('');
    setReceiverAddress('');
    setDiscount(0);
    setShippingCost(0);
    setPaidAmount(0);
    setPaymentReference('');
    setErrorMessage(null);
    setSuccessOrderId(null);
    setLastCreatedOrder(null);
    setDeliveryDate(getTodayLocalISODate());
    if (products.length > 0) {
      const firstProd = products[0];
      setItems([{
        tempId: `line-${Date.now()}`,
        productId: firstProd.id,
        productName: firstProd.name,
        sku: firstProd.sku,
        unitCost: firstProd.unitCost,
        unitPrice: firstProd.sellingPrice,
        quantity: 1,
        availableStock: firstProd.stock,
        lineTotal: firstProd.sellingPrice
      }]);
    }
  };

  // Submit Order to Database
  const handleSubmitOrder = (statusToSave: OrderStatus = orderStatus) => {
    setErrorMessage(null);

    const effectiveCustomerName = customerName.trim();
    const effectiveCustomerPhone = customerPhone.trim();
    const effectiveCustomerAddress = customerAddress.trim() || receiverAddress.trim();

    const effectiveReceiverName = receiverName.trim() || effectiveCustomerName;
    const effectiveReceiverPhone = receiverPhone.trim() || effectiveCustomerPhone;
    const effectiveReceiverAddress = receiverAddress.trim() || effectiveCustomerAddress;

    // Form validations
    if (!effectiveCustomerName) {
      setErrorMessage('Customer name is required.');
      return;
    }
    if (!effectiveCustomerPhone) {
      setErrorMessage('Customer phone number is required.');
      return;
    }
    if (!effectiveReceiverAddress) {
      setErrorMessage('Delivery address / customer address is required.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Please add at least one product item to this order.');
      return;
    }

    // Stock validation for Confirmed status
    if (statusToSave === 'confirmed') {
      for (const item of items) {
        const prod = products.find(p => p.id === item.productId);
        if (!prod || prod.stock < item.quantity) {
          setErrorMessage(`Insufficient stock for "${item.productName}". Available: ${prod?.stock || 0}, Requested: ${item.quantity}.`);
          return;
        }
      }
    }

    // Discount validation
    if (discount < 0) {
      setErrorMessage('Discount amount cannot be negative.');
      return;
    }
    if (discount > subtotal) {
      setErrorMessage('Discount cannot exceed subtotal amount.');
      return;
    }

    // Paid amount validation
    if (paidAmount < 0) {
      setErrorMessage('Paid amount cannot be negative.');
      return;
    }
    if (paidAmount > grandTotal) {
      setErrorMessage('Paid amount cannot exceed grand total.');
      return;
    }

    setIsSubmitting(true);

    const paymentStatus: PaymentStatus = paidAmount >= grandTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    const orderPayload = {
      customerId: selectedCustomerId || `cust-${Date.now()}`,
      customerName: effectiveCustomerName,
      customerPhone: effectiveCustomerPhone,
      customerAddress: effectiveCustomerAddress,
      receiverName: effectiveReceiverName,
      receiverPhone: effectiveReceiverPhone,
      deliveryAddress: effectiveReceiverAddress,
      sameAsCustomer,
      deliveryDate: deliveryDate || getTodayLocalISODate(),
      deliverySlot,
      deliveryInstructions,
      items: items.map(item => ({
        id: `item-${Date.now()}-${Math.random()}`,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unitCost: item.unitCost,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      subtotal,
      discount: Number(discount) || 0,
      shippingCost: 0,
      grandTotal,
      paidAmount: Number(paidAmount) || 0,
      dueBalance,
      paymentMethod,
      paymentReference,
      paymentStatus,
      orderStatus: statusToSave,
    };

    const result = createOrder(orderPayload);
    setIsSubmitting(false);

    if (result.success && result.orderId) {
      setSuccessOrderId(result.orderId);
      if (result.order) {
        setLastCreatedOrder(result.order);
        // Automatically open invoice modal so the user can immediately print or save as PDF!
        openInvoiceModal(result.order);
      }
    } else {
      setErrorMessage(result.error || 'Failed to save order. Please check inputs.');
    }
  };

  // Quick Customer Creation
  const handleSaveQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    const res = addCustomer({
      name: newCustName,
      phone: newCustPhone,
      address: newCustAddress,
      notes: 'Quick-added customer',
    });

    if (res.success && res.customer) {
      setCustomerMode('existing');
      setSelectedCustomerId(res.customer.id);
      setCustomerName(res.customer.name);
      setCustomerPhone(res.customer.phone);
      setCustomerAddress(res.customer.address);
      setShowQuickCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
    }
  };

  // Quick Product Creation
  const handleSaveQuickProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const res = addProduct({
      name: newProdName,
      sku: (newProdSku.trim() || `GC-${Date.now().toString().slice(-6)}`).toUpperCase(),
      category: 'General Gifts',
      sellingPrice: Number(newProdPrice) || 0,
      unitCost: Number(newProdCost) || 0,
      stock: Number(newProdStock) || 0,
      lowStockThreshold: 5,
      unit: 'pcs',
      isActive: true,
    });

    if (res.success && res.product) {
      setShowQuickProductModal(false);
      // Automatically add this new product to order line items
      setItems(prev => [...prev, {
        tempId: `line-${Date.now()}`,
        productId: res.product!.id,
        productName: res.product!.name,
        sku: res.product!.sku,
        unitCost: res.product!.unitCost,
        unitPrice: res.product!.sellingPrice,
        quantity: 1,
        availableStock: res.product!.stock,
        lineTotal: res.product!.sellingPrice,
      }]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
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
              <ShoppingBag className="w-6 h-6 text-[#4F35F5]" />
              {t.newOrderTitle} & Invoice Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {t.newOrderSubtitle} — Official Gift City Sales Order & Invoice
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            type="button"
            onClick={handleResetForm}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetForm}</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('orders')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
          >
            <span>{t.orders}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successOrderId && (
        <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-emerald-950">
                  Order {successOrderId} Created Successfully!
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-200 text-emerald-800 uppercase">
                  Invoice Ready
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                Customer &ldquo;{lastCreatedOrder?.customerName || customerName}&rdquo; ({lastCreatedOrder?.customerPhone || customerPhone}) details saved to Customers list.
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                🕒 Order Local Time: {lastCreatedOrder?.createdAtLocal || formatLocalDateTime(lastCreatedOrder?.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {lastCreatedOrder && (
              <button 
                type="button"
                onClick={() => openInvoiceModal(lastCreatedOrder)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#4F35F5] hover:bg-indigo-600 text-white rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Download Invoice PDF</span>
              </button>
            )}
            <button 
              type="button"
              onClick={() => setActiveTab('orders')}
              className="px-3.5 py-2 text-xs font-bold bg-white text-emerald-800 border border-emerald-300 rounded-xl hover:bg-emerald-100 transition-all cursor-pointer"
            >
              View in Orders List
            </button>
            <button 
              type="button"
              onClick={handleResetForm}
              className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all cursor-pointer"
            >
              + {t.createAnother}
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* FORM BODY */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmitOrder(); }} className="space-y-6">
        
        {/* ========================================================
            SECTION A: CUSTOMER INFORMATION (Matching Reference Image 2)
            ======================================================== */}
        <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F35F5]"></span>
              {t.sectionA}
            </h3>

            {/* Existing vs Walk-in Mode Switch */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    customerMode === 'existing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.existingCustomer}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode('walkin');
                    setSelectedCustomerId('');
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    customerMode === 'walkin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.walkInCustomer}
                </button>
              </div>

              <button 
                type="button"
                onClick={() => setShowQuickCustomerModal(true)}
                className="px-2.5 py-1 text-xs font-semibold text-[#4F35F5] bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
              >
                + {t.quickAddCustomer}
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* If Existing customer mode, customer picker dropdown */}
            {customerMode === 'existing' && (
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.chooseCustomer}
                </label>
                <select 
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 focus:border-[#4F35F5] outline-none"
                >
                  <option value="">-- Select Customer from Directory ({customers.length} registered) --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone} ({c.totalOrders} orders, Total: ৳{c.totalSpent.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.customerName} <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rashid Khan"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 focus:border-[#4F35F5] outline-none"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.phoneNumber} <span className="text-rose-500">*</span>
              </label>
              <input 
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 focus:border-[#4F35F5] outline-none"
              />
            </div>

            {/* Customer Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.address}
              </label>
              <input 
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="House, Road, Area, City"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 focus:border-[#4F35F5] outline-none"
              />
            </div>

          </div>
        </div>

        {/* ========================================================
            SECTION B: RECEIVER DETAILS (Matching Reference Image 2)
            ======================================================== */}
        <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              {t.sectionB}
            </h3>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.receiverName} <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                required
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Receiver full name"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.receiverPhone} <span className="text-rose-500">*</span>
              </label>
              <input 
                type="tel"
                required
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.deliveryAddress} <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                required
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                placeholder="Exact shipping address"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none"
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            SECTION C: DELIVERY TIME & SCHEDULE
            ======================================================== */}
        <div className="bg-white rounded-2xl border-2 border-sky-100 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              {t.sectionC}
            </h3>
            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Local Time: {getCurrentLocalDateTimeString()}</span>
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.deliveryDate} <span className="text-rose-500">*</span>
              </label>
              <input 
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.deliverySlot}
              </label>
              <select 
                value={deliverySlot}
                onChange={(e) => setDeliverySlot(e.target.value as DeliverySlot)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/30 outline-none"
              >
                <option value="anytime">{t.slotAnytime}</option>
                <option value="morning">{t.slotMorning}</option>
                <option value="afternoon">{t.slotAfternoon}</option>
                <option value="evening">{t.slotEvening}</option>
                <option value="specific_time">{t.slotSpecific}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.specificTime}
              </label>
              <input 
                type="text"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Call before arrival, gift wrapping note"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/30 outline-none"
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            SECTION D: PRODUCT LINE ITEMS (Matching Reference Image 2)
            ======================================================== */}
        <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F35F5]"></span>
              {t.sectionD}
            </h3>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setShowQuickProductModal(true)}
                className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
              >
                {t.quickAddProduct}
              </button>
              <button 
                type="button"
                onClick={handleAddLineItem}
                className="px-3 py-1 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-lg shadow-xs transition-all"
              >
                {t.addLineItem}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {items.map((item, idx) => (
              <div 
                key={item.tempId} 
                className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-slate-100/60 transition-colors"
              >
                {/* Product Dropdown */}
                <div className="md:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {t.selectProduct}
                  </label>
                  <select 
                    value={item.productId}
                    onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    className="w-full px-2.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock} {p.unit}) — ৳{p.sellingPrice}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available Stock Display */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {t.availableStock}
                  </label>
                  <div className="px-2.5 py-2 text-xs bg-slate-100 rounded-lg border border-slate-200 font-semibold text-slate-700 flex items-center justify-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      item.availableStock > 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.availableStock} in stock
                    </span>
                  </div>
                </div>

                {/* Unit Price */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {t.unitPrice} (৳)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    className="w-full px-2.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                  />
                </div>

                {/* Quantity */}
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {t.quantity}
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max={orderStatus === 'confirmed' ? item.availableStock : undefined}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-full px-2 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg font-bold text-center text-slate-900 focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                  />
                </div>

                {/* Line Total */}
                <div className="md:col-span-1 text-right">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {t.lineTotal}
                  </label>
                  <p className="text-sm font-extrabold text-[#4F35F5] py-2">
                    ৳{item.lineTotal.toLocaleString()}
                  </p>
                </div>

                {/* Remove Line */}
                <div className="md:col-span-1 flex justify-end">
                  <button 
                    type="button"
                    onClick={() => handleRemoveLineItem(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================
            SECTION E: ORDER STATUS (Confirmed vs Pending - Ref 2)
            ======================================================== */}
        <div className="bg-white rounded-2xl border-2 border-amber-100 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              {t.sectionE}
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Confirmed Option */}
              <div 
                onClick={() => setOrderStatus('confirmed')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  orderStatus === 'confirmed' 
                    ? 'border-[#4F35F5] bg-indigo-50/40 shadow-xs' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      orderStatus === 'confirmed' ? 'border-[#4F35F5] bg-[#4F35F5]' : 'border-slate-300'
                    }`}>
                      {orderStatus === 'confirmed' && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="font-bold text-slate-900 text-sm">{t.confirmed}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Live Stock Deduct
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 pl-6">
                  {t.confirmedDesc}
                </p>
              </div>

              {/* Pending Option */}
              <div 
                onClick={() => setOrderStatus('pending')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  orderStatus === 'pending' 
                    ? 'border-amber-500 bg-amber-50/40 shadow-xs' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      orderStatus === 'pending' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                    }`}>
                      {orderStatus === 'pending' && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="font-bold text-slate-900 text-sm">{t.pending}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Draft / Reserved
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 pl-6">
                  {t.pendingDesc}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ========================================================
            SECTION F & G: DISCOUNT, SHIPPING & PAYMENT
            ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section F: Discount & Shipping */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
              {t.sectionF}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.discountBDT}
              </label>
              <input 
                type="number"
                min="0"
                max={subtotal}
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
              />
            </div>


          </div>

          {/* Section G: Payment */}
          <div className="bg-white rounded-2xl border-2 border-teal-100 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
              {t.sectionG}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.paymentMethod}
                </label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/30 outline-none"
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
                  {t.paidAmount}
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/30 outline-none font-bold text-emerald-700"
                  />
                  <button 
                    type="button" 
                    onClick={() => setPaidAmount(grandTotal)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded"
                  >
                    Full
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.paymentReference}
              </label>
              <input 
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. bKash TrxID: 9X77AB12"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/30 outline-none"
              />
            </div>
          </div>

        </div>

        {/* ========================================================
            SECTION H: ORDER SUMMARY & ACTIONS (Matching Ref 2)
            ======================================================== */}
        <div className="bg-[#10192F] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-950">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pb-6 border-b border-slate-800 text-center">
            
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[11px] font-semibold text-slate-400 block">{t.subtotal}</span>
              <span className="text-base sm:text-lg font-bold text-white mt-1 block">
                ৳{subtotal.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[11px] font-semibold text-rose-300 block">{t.discount}</span>
              <span className="text-base sm:text-lg font-bold text-rose-400 mt-1 block">
                -৳{Number(discount || 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-indigo-950/60 p-3 rounded-xl border border-indigo-500/40">
              <span className="text-[11px] font-semibold text-indigo-300 block">{t.grandTotal}</span>
              <span className="text-lg sm:text-xl font-extrabold text-white mt-1 block">
                ৳{grandTotal.toLocaleString()}
              </span>
            </div>

            <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
              <span className="text-[11px] font-semibold text-emerald-300 block">{t.paidAmount}</span>
              <span className="text-base sm:text-lg font-bold text-emerald-400 mt-1 block">
                ৳{Number(paidAmount || 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
              <span className="text-[11px] font-semibold text-amber-300 block">{t.dueBalance}</span>
              <span className="text-base sm:text-lg font-bold text-amber-400 mt-1 block">
                ৳{dueBalance.toLocaleString()}
              </span>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {t.resetForm}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button 
                type="button"
                onClick={() => handleSubmitOrder('pending')}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                {t.saveAsPending}
              </button>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#4F35F5] hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/40 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 border border-indigo-400/40 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Create Order & Generate Invoice (প্রিন্ট / পিডিএফ)</span>
              </button>
            </div>
          </div>
        </div>

      </form>

      {/* QUICK ADD CUSTOMER MODAL */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#4F35F5]" />
              {t.quickAddCustomer}
            </h3>
            <form onSubmit={handleSaveQuickCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Asif Mahmud"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input 
                  type="tel" 
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Address</label>
                <input 
                  type="text" 
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Area, Road, Dhaka"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowQuickCustomerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-xl shadow-xs"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD PRODUCT MODAL */}
      {showQuickProductModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#4F35F5]" />
              {t.quickAddProduct}
            </h3>
            <form onSubmit={handleSaveQuickProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                <input 
                  type="text" 
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Royal Crystal Mug Set"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (৳)</label>
                  <input 
                    type="number" 
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost (৳)</label>
                  <input 
                    type="number" 
                    required
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock</label>
                  <input 
                    type="number" 
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowQuickProductModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-xl shadow-xs"
                >
                  Save & Add to Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
