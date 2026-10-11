import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, Customer, Product, Order, OrderStatus, PaymentStatus,
  FinanceEntry, StockMovement, AuditLog, AppSettings, 
  DeliverySlot, PaymentMethod 
} from '../types';
import { 
  initialUsers, initialCustomers, initialProducts, 
  initialOrders, initialFinanceEntries, initialStockMovements, 
  initialAuditLogs, initialSettings 
} from '../data/initialData';
import { translations, Language } from '../i18n/translations';
import { getCurrentLocalDateTimeString } from '../utils/dateUtils';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSubTab?: string;
  setActiveSubTab: (subTab?: string) => void;
  
  customers: Customer[];
  products: Product[];
  orders: Order[];
  financeEntries: FinanceEntry[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  // Actions
  createOrder: (orderInput: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'stockDeducted' | 'createdBy' | 'createdByName'>) => { success: boolean; orderId?: string; order?: Order; error?: string };
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, reason?: string) => { success: boolean; error?: string };
  recordOrderPayment: (orderId: string, amount: number, method: PaymentMethod, reference?: string) => { success: boolean; error?: string };
  
  addCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'dueBalance' | 'createdAt' | 'updatedAt'>) => { success: boolean; customer?: Customer; error?: string };
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; product?: Product; error?: string };
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  stockIn: (productId: string, quantity: number, unitCost?: number, reference?: string, reason?: string) => { success: boolean; error?: string };
  stockOut: (productId: string, quantity: number, reason: string, reference?: string) => { success: boolean; error?: string };
  
  addFinanceEntry: (entry: Omit<FinanceEntry, 'id' | 'createdAt' | 'recordedBy' | 'recordedByName'>) => { success: boolean; error?: string };
  deleteFinanceEntry: (id: string) => void;
  
  // Realtime & Sync
  syncStatus: 'connected' | 'syncing' | 'offline';
  lastSyncTime: string;
  
  // Invoice modal
  selectedOrderForInvoice: Order | null;
  openInvoiceModal: (order: Order) => void;
  closeInvoiceModal: () => void;
  
  // Global search
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  
  // Reset database to initial seed
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  USERS: 'gift_city_users_v3',
  CURRENT_USER: 'gift_city_current_user_v3',
  LANG: 'gift_city_lang_v3',
  CUSTOMERS: 'gift_city_customers_v3',
  PRODUCTS: 'gift_city_products_v3',
  ORDERS: 'gift_city_orders_v3',
  FINANCE: 'gift_city_finance_v3',
  STOCK_MOVEMENTS: 'gift_city_stock_movements_v3',
  AUDIT_LOGS: 'gift_city_audit_logs_v3',
  SETTINGS: 'gift_city_settings_v3',
};

// Safe JSON parser with fallback
function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    return fallback;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => loadStored(STORAGE_KEYS.USERS, initialUsers));
  const [currentUser, setCurrentUser] = useState<User>(() => loadStored(STORAGE_KEYS.CURRENT_USER, initialUsers[0]));
  const [language, setLanguageState] = useState<Language>(() => loadStored(STORAGE_KEYS.LANG, 'en'));
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);
  
  const [customers, setCustomers] = useState<Customer[]>(() => loadStored(STORAGE_KEYS.CUSTOMERS, initialCustomers));
  const [products, setProducts] = useState<Product[]>(() => loadStored(STORAGE_KEYS.PRODUCTS, initialProducts));
  const [orders, setOrders] = useState<Order[]>(() => loadStored(STORAGE_KEYS.ORDERS, initialOrders));
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>(() => loadStored(STORAGE_KEYS.FINANCE, initialFinanceEntries));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => loadStored(STORAGE_KEYS.STOCK_MOVEMENTS, initialStockMovements));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStored(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs));
  const [settings, setSettings] = useState<AppSettings>(() => loadStored(STORAGE_KEYS.SETTINGS, initialSettings));

  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const isLocalUpdateRef = useRef(false);

  // Cache to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LANG, JSON.stringify(language)); }, [language]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(financeEntries)); }, [financeEntries]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(stockMovements)); }, [stockMovements]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);

  // Apply server-provided state to React state
  const applyServerData = useCallback((serverDb: any) => {
    if (!serverDb || typeof serverDb !== 'object') return;
    if (Array.isArray(serverDb.customers)) setCustomers(serverDb.customers);
    if (Array.isArray(serverDb.products)) setProducts(serverDb.products);
    if (Array.isArray(serverDb.orders)) setOrders(serverDb.orders);
    if (Array.isArray(serverDb.financeEntries)) setFinanceEntries(serverDb.financeEntries);
    if (Array.isArray(serverDb.stockMovements)) setStockMovements(serverDb.stockMovements);
    if (Array.isArray(serverDb.auditLogs)) setAuditLogs(serverDb.auditLogs);
    if (serverDb.settings) setSettings(serverDb.settings);
    if (Array.isArray(serverDb.users)) setUsers(serverDb.users);
  }, []);

  // Post updates to server
  const syncToServer = useCallback((payload: Record<string, any>) => {
    isLocalUpdateRef.current = true;
    setSyncStatus('syncing');

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSyncStatus('connected');
          setLastSyncTime(data.lastUpdated || new Date().toISOString());
        }
      })
      .catch(() => {
        setSyncStatus('offline');
      })
      .finally(() => {
        setTimeout(() => {
          isLocalUpdateRef.current = false;
        }, 300);
      });
  }, []);

  // Multi-device synchronization engine
  useEffect(() => {
    // 1. Initial fetch from server
    fetch('/api/data')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.db) {
          applyServerData(res.db);
          setSyncStatus('connected');
          setLastSyncTime(res.lastUpdated || new Date().toISOString());
        }
      })
      .catch(() => {
        setSyncStatus('offline');
      });

    // 2. Real-Time Server-Sent Events (SSE) stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'SYNC_UPDATE' || parsed.type === 'CONNECTED') {
            applyServerData(parsed.data);
            setSyncStatus('connected');
            setLastSyncTime(parsed.timestamp || new Date().toISOString());
          }
        } catch {
          // ignore parsing error
        }
      };

      eventSource.onerror = () => {
        setSyncStatus('syncing');
      };
    } catch {
      // EventSource fallback handled by polling below
    }

    // 3. Periodic polling fallback every 3 seconds to guarantee cross-device sync
    const intervalId = setInterval(() => {
      if (isLocalUpdateRef.current) return;
      fetch('/api/data')
        .then(res => res.json())
        .then(res => {
          if (res.success && res.db) {
            applyServerData(res.db);
            setSyncStatus('connected');
          }
        })
        .catch(() => {
          setSyncStatus('offline');
        });
    }, 3000);

    // 4. On window visibility / focus (e.g. mobile screen unlock)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetch('/api/data')
          .then(res => res.json())
          .then(res => {
            if (res.success && res.db) {
              applyServerData(res.db);
              setSyncStatus('connected');
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      eventSource?.close();
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [applyServerData]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const logAudit = (action: string, module: AuditLog['module'], details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      module,
      details,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 199)]);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    logAudit('SETTINGS_UPDATED', 'system', 'Updated system preferences and company configuration.');
    syncToServer({ settings: updated });
  };

  // Reset to default seed
  const resetToDefaultData = () => {
    fetch('/api/reset', { method: 'POST' })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.db) {
          applyServerData(res.db);
        }
      })
      .catch(() => {
        setUsers(initialUsers);
        setCurrentUser(initialUsers[0]);
        setCustomers(initialCustomers);
        setProducts(initialProducts);
        setOrders(initialOrders);
        setFinanceEntries(initialFinanceEntries);
        setStockMovements(initialStockMovements);
        setAuditLogs(initialAuditLogs);
        setSettings(initialSettings);
      });
  };

  // Customer Management
  const addCustomer = (customerInput: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'dueBalance' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer: Customer = {
      ...customerInput,
      id: `cust-${Date.now()}`,
      totalOrders: 0,
      totalSpent: 0,
      dueBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedCustomers = [newCustomer, ...customers];
    setCustomers(updatedCustomers);
    logAudit('CUSTOMER_CREATED', 'customers', `Added new customer: ${newCustomer.name} (${newCustomer.phone})`);
    syncToServer({ customers: updatedCustomers });
    return { success: true, customer: newCustomer };
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const updatedCustomers = customers.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
    setCustomers(updatedCustomers);
    logAudit('CUSTOMER_UPDATED', 'customers', `Updated customer ID: ${id}`);
    syncToServer({ customers: updatedCustomers });
  };

  const deleteCustomer = (id: string) => {
    const updatedCustomers = customers.filter(c => c.id !== id);
    setCustomers(updatedCustomers);
    logAudit('CUSTOMER_DELETED', 'customers', `Deleted customer ID: ${id}`);
    syncToServer({ customers: updatedCustomers });
  };

  // Product Management
  const addProduct = (productInput: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productInput,
      id: `prod-${Date.now()}`,
      sku: productInput.sku || `GC-${Date.now().toString().slice(-6)}`,
      category: productInput.category || 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedProducts = [newProduct, ...products];
    setProducts(updatedProducts);

    let updatedMovements = [...stockMovements];
    if (newProduct.stock > 0) {
      const movement: StockMovement = {
        id: `sm-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku || '',
        type: 'stock_in',
        quantityIn: newProduct.stock,
        quantityOut: 0,
        previousStock: 0,
        newStock: newProduct.stock,
        unitCost: newProduct.unitCost,
        reference: 'INITIAL_STOCK',
        reason: 'Opening stock count during product registration',
        recordedBy: currentUser.id,
        recordedByName: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      updatedMovements = [movement, ...updatedMovements];
      setStockMovements(updatedMovements);
    }

    logAudit('PRODUCT_CREATED', 'inventory', `Created product: ${newProduct.name}`);
    syncToServer({ products: updatedProducts, stockMovements: updatedMovements });
    return { success: true, product: newProduct };
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const updatedProducts = products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
    setProducts(updatedProducts);
    logAudit('PRODUCT_UPDATED', 'inventory', `Updated product details for ID: ${id}`);
    syncToServer({ products: updatedProducts });
  };

  const deleteProduct = (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    logAudit('PRODUCT_DELETED', 'inventory', `Removed product ID: ${id}`);
    syncToServer({ products: updatedProducts });
  };

  // Stock In
  const stockIn = (productId: string, quantity: number, unitCost?: number, reference?: string, reason?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return { success: false, error: 'Product not found.' };
    if (quantity <= 0) return { success: false, error: 'Quantity must be greater than zero.' };

    const previousStock = product.stock;
    const newStock = previousStock + quantity;
    const finalUnitCost = unitCost ?? product.unitCost;

    const updatedProducts = products.map(p => p.id === productId ? { 
      ...p, 
      stock: newStock, 
      unitCost: finalUnitCost, 
      updatedAt: new Date().toISOString() 
    } : p);
    setProducts(updatedProducts);

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku || '',
      type: 'stock_in',
      quantityIn: quantity,
      quantityOut: 0,
      previousStock,
      newStock,
      unitCost: finalUnitCost,
      reference: reference || 'STOCK_IN',
      reason: reason || 'Inventory replenishment received',
      recordedBy: currentUser.id,
      recordedByName: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    const updatedMovements = [movement, ...stockMovements];
    setStockMovements(updatedMovements);

    logAudit('STOCK_IN', 'inventory', `Added +${quantity} units to ${product.name}`);
    syncToServer({ products: updatedProducts, stockMovements: updatedMovements });
    return { success: true };
  };

  // Stock Out
  const stockOut = (productId: string, quantity: number, reason: string, reference?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return { success: false, error: 'Product not found.' };
    if (quantity <= 0) return { success: false, error: 'Quantity must be greater than zero.' };
    if (quantity > product.stock) {
      return { success: false, error: `Cannot remove ${quantity} units. Only ${product.stock} available in stock.` };
    }

    const previousStock = product.stock;
    const newStock = previousStock - quantity;

    const updatedProducts = products.map(p => p.id === productId ? { 
      ...p, 
      stock: newStock, 
      updatedAt: new Date().toISOString() 
    } : p);
    setProducts(updatedProducts);

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku || '',
      type: 'stock_out',
      quantityIn: 0,
      quantityOut: quantity,
      previousStock,
      newStock,
      unitCost: product.unitCost,
      reference: reference || 'STOCK_OUT',
      reason: reason || 'Stock adjustment/damage/sample write-off',
      recordedBy: currentUser.id,
      recordedByName: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    const updatedMovements = [movement, ...stockMovements];
    setStockMovements(updatedMovements);

    logAudit('STOCK_OUT', 'inventory', `Deducted -${quantity} units from ${product.name}. Reason: ${reason}`);
    syncToServer({ products: updatedProducts, stockMovements: updatedMovements });
    return { success: true };
  };

  // Create Order
  const createOrder = (orderInput: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'stockDeducted' | 'createdBy' | 'createdByName'>) => {
    const now = new Date().toISOString();
    const nowLocal = getCurrentLocalDateTimeString();
    const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    if (orderInput.orderStatus === 'confirmed') {
      for (const item of orderInput.items) {
        const prod = products.find(p => p.id === item.productId);
        if (prod && prod.stock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for "${item.productName}". Available: ${prod.stock}, Requested: ${item.quantity}.`,
          };
        }
      }
    }

    const newOrder: Order = {
      ...orderInput,
      id: orderId,
      shippingCost: orderInput.shippingCost ?? 0,
      createdAt: now,
      createdAtLocal: nowLocal,
      updatedAt: now,
      stockDeducted: orderInput.orderStatus === 'confirmed',
      createdBy: currentUser.id,
      createdByName: currentUser.name,
    };

    let updatedProducts = [...products];
    let updatedMovements = [...stockMovements];

    if (newOrder.stockDeducted) {
      for (const item of newOrder.items) {
        const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
        if (prodIdx !== -1) {
          const prod = updatedProducts[prodIdx];
          const previousStock = prod.stock;
          const newStock = previousStock - item.quantity;
          updatedProducts[prodIdx] = { ...prod, stock: newStock, updatedAt: now };

          updatedMovements.unshift({
            id: `sm-${Date.now()}-${item.productId}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku || '',
            type: 'order_deduct',
            quantityIn: 0,
            quantityOut: item.quantity,
            previousStock,
            newStock,
            unitCost: item.unitCost,
            reference: orderId,
            reason: `Dispatched for order ${orderId}`,
            recordedBy: currentUser.id,
            recordedByName: currentUser.name,
            createdAt: now,
          });
        }
      }
      setProducts(updatedProducts);
      setStockMovements(updatedMovements);
    }

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);

    // Save or update customer record in Customers list
    let updatedCustomers = [...customers];
    const customerPhoneTrimmed = (newOrder.customerPhone || '').trim();
    const customerNameTrimmed = (newOrder.customerName || '').trim();
    const customerAddressTrimmed = (newOrder.customerAddress || newOrder.deliveryAddress || '').trim();

    const existingIndex = updatedCustomers.findIndex(c => 
      (newOrder.customerId && newOrder.customerId.startsWith('cust-') && c.id === newOrder.customerId) ||
      (customerPhoneTrimmed && c.phone.trim() === customerPhoneTrimmed)
    );

    if (existingIndex !== -1) {
      const existing = updatedCustomers[existingIndex];
      const updatedCustomer: Customer = {
        ...existing,
        name: customerNameTrimmed || existing.name,
        phone: customerPhoneTrimmed || existing.phone,
        address: customerAddressTrimmed || existing.address,
        totalOrders: existing.totalOrders + 1,
        totalSpent: existing.totalSpent + newOrder.grandTotal,
        dueBalance: existing.dueBalance + newOrder.dueBalance,
        updatedAt: now,
      };
      updatedCustomers[existingIndex] = updatedCustomer;
      newOrder.customerId = updatedCustomer.id;
    } else {
      const newCustId = (newOrder.customerId && newOrder.customerId.startsWith('cust-')) 
        ? newOrder.customerId 
        : `cust-${Date.now()}`;
      const newCustomer: Customer = {
        id: newCustId,
        name: customerNameTrimmed,
        phone: customerPhoneTrimmed,
        address: customerAddressTrimmed,
        email: '',
        notes: 'Saved automatically from order creation',
        totalOrders: 1,
        totalSpent: newOrder.grandTotal,
        dueBalance: newOrder.dueBalance,
        createdAt: now,
        updatedAt: now,
      };
      updatedCustomers = [newCustomer, ...updatedCustomers];
      newOrder.customerId = newCustId;
    }
    setCustomers(updatedCustomers);

    let updatedFinance = [...financeEntries];
    if (newOrder.paidAmount > 0) {
      const financeEntry: FinanceEntry = {
        id: `fin-ord-${Date.now()}`,
        type: 'income',
        category: 'order_sale',
        amount: newOrder.paidAmount,
        paymentMethod: newOrder.paymentMethod,
        reference: orderId,
        description: `Order payment for ${newOrder.customerName} (${orderId})`,
        recordedBy: currentUser.id,
        recordedByName: currentUser.name,
        date: newOrder.deliveryDate || now.split('T')[0],
        relatedOrderId: orderId,
        createdAt: now,
      };
      updatedFinance = [financeEntry, ...updatedFinance];
      setFinanceEntries(updatedFinance);
    }

    logAudit('ORDER_CREATED', 'orders', `Created order ${orderId} for ${newOrder.customerName} (Status: ${newOrder.orderStatus}, Amount: ৳${newOrder.grandTotal})`);

    syncToServer({
      orders: updatedOrders,
      products: updatedProducts,
      stockMovements: updatedMovements,
      customers: updatedCustomers,
      financeEntries: updatedFinance,
    });

    return { success: true, orderId, order: newOrder };
  };

  // Reconcile Order Status
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, reason?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found.' };

    const now = new Date().toISOString();
    let updatedProducts = [...products];
    const newMovements: StockMovement[] = [];
    let newStockDeducted = order.stockDeducted;

    if (!order.stockDeducted && (newStatus === 'confirmed' || newStatus === 'delivered')) {
      for (const item of order.items) {
        const prod = updatedProducts.find(p => p.id === item.productId);
        if (prod && prod.stock < item.quantity) {
          return { 
            success: false, 
            error: `Cannot confirm order ${orderId}. Product "${prod.name}" has only ${prod.stock} in stock (needed: ${item.quantity}).` 
          };
        }
      }

      for (const item of order.items) {
        const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
        if (prodIdx !== -1) {
          const prod = updatedProducts[prodIdx];
          const previousStock = prod.stock;
          const newStock = previousStock - item.quantity;
          updatedProducts[prodIdx] = { ...prod, stock: newStock, updatedAt: now };

          newMovements.push({
            id: `sm-${Date.now()}-${item.productId}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku || '',
            type: 'order_deduct',
            quantityIn: 0,
            quantityOut: item.quantity,
            previousStock,
            newStock,
            unitCost: item.unitCost,
            reference: orderId,
            reason: `Order confirmed from pending status (${orderId})`,
            recordedBy: currentUser.id,
            recordedByName: currentUser.name,
            createdAt: now,
          });
        }
      }
      newStockDeducted = true;
    } else if (order.stockDeducted && newStatus === 'cancelled') {
      for (const item of order.items) {
        const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
        if (prodIdx !== -1) {
          const prod = updatedProducts[prodIdx];
          const previousStock = prod.stock;
          const newStock = previousStock + item.quantity;
          updatedProducts[prodIdx] = { ...prod, stock: newStock, updatedAt: now };

          newMovements.push({
            id: `sm-${Date.now()}-${item.productId}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku || '',
            type: 'order_restore',
            quantityIn: item.quantity,
            quantityOut: 0,
            previousStock,
            newStock,
            unitCost: item.unitCost,
            reference: orderId,
            reason: `Order cancelled restoration: ${reason || 'Customer cancellation'}`,
            recordedBy: currentUser.id,
            recordedByName: currentUser.name,
            createdAt: now,
          });
        }
      }
      newStockDeducted = false;
    }

    let updatedMovements = [...stockMovements];
    if (newMovements.length > 0) {
      updatedMovements = [...newMovements, ...updatedMovements];
      setProducts(updatedProducts);
      setStockMovements(updatedMovements);
    }

    const updatedOrders = orders.map(o => o.id === orderId ? {
      ...o,
      orderStatus: newStatus,
      stockDeducted: newStockDeducted,
      updatedAt: now,
    } : o);
    setOrders(updatedOrders);

    logAudit('ORDER_STATUS_CHANGED', 'orders', `Order ${orderId} changed to ${newStatus}. ${reason ? `Reason: ${reason}` : ''}`);

    syncToServer({
      orders: updatedOrders,
      products: updatedProducts,
      stockMovements: updatedMovements,
    });

    return { success: true };
  };

  // Record additional payment
  const recordOrderPayment = (orderId: string, amount: number, method: PaymentMethod, reference?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found.' };
    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than zero.' };
    if (amount > order.dueBalance) {
      return { success: false, error: `Payment cannot exceed remaining due (৳${order.dueBalance}).` };
    }

    const now = new Date().toISOString();
    const newPaidAmount = order.paidAmount + amount;
    const newDueBalance = order.grandTotal - newPaidAmount;
    const newPaymentStatus: PaymentStatus = newDueBalance <= 0 ? 'paid' : 'partial';

    const updatedOrders = orders.map(o => o.id === orderId ? {
      ...o,
      paidAmount: newPaidAmount,
      dueBalance: newDueBalance,
      paymentStatus: newPaymentStatus,
      updatedAt: now,
    } : o);
    setOrders(updatedOrders);

    let updatedCustomers = [...customers];
    if (order.customerId) {
      updatedCustomers = customers.map(c => c.id === order.customerId ? {
        ...c,
        dueBalance: Math.max(0, c.dueBalance - amount),
        updatedAt: now,
      } : c);
      setCustomers(updatedCustomers);
    }

    const financeEntry: FinanceEntry = {
      id: `fin-pay-${Date.now()}`,
      type: 'income',
      category: 'order_sale',
      amount,
      paymentMethod: method,
      reference: reference || orderId,
      description: `Installment/due collection for ${order.customerName} (${orderId})`,
      recordedBy: currentUser.id,
      recordedByName: currentUser.name,
      date: now.split('T')[0],
      relatedOrderId: orderId,
      createdAt: now,
    };
    const updatedFinance = [financeEntry, ...financeEntries];
    setFinanceEntries(updatedFinance);

    logAudit('ORDER_PAYMENT_COLLECTED', 'finance', `Collected ৳${amount} for order ${orderId} via ${method}`);

    syncToServer({
      orders: updatedOrders,
      customers: updatedCustomers,
      financeEntries: updatedFinance,
    });

    return { success: true };
  };

  // Add Finance Entry
  const addFinanceEntry = (entryInput: Omit<FinanceEntry, 'id' | 'createdAt' | 'recordedBy' | 'recordedByName'>) => {
    if (entryInput.amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero.' };
    }

    const now = new Date().toISOString();
    const newEntry: FinanceEntry = {
      ...entryInput,
      id: `fin-${Date.now()}`,
      recordedBy: currentUser.id,
      recordedByName: currentUser.name,
      createdAt: now,
    };

    const updatedFinance = [newEntry, ...financeEntries];
    setFinanceEntries(updatedFinance);

    logAudit(entryInput.type === 'income' ? 'INCOME_RECORDED' : 'EXPENSE_RECORDED', 'finance', 
      `Recorded ${entryInput.type.toUpperCase()}: ৳${entryInput.amount} [${entryInput.category}] - ${entryInput.description}`);

    syncToServer({ financeEntries: updatedFinance });
    return { success: true };
  };

  const deleteFinanceEntry = (id: string) => {
    const updatedFinance = financeEntries.filter(f => f.id !== id);
    setFinanceEntries(updatedFinance);
    logAudit('FINANCE_RECORD_DELETED', 'finance', `Deleted ledger entry ID: ${id}`);
    syncToServer({ financeEntries: updatedFinance });
  };

  const openInvoiceModal = (order: Order) => {
    setSelectedOrderForInvoice(order);
  };

  const closeInvoiceModal = () => {
    setSelectedOrderForInvoice(null);
  };

  const t = translations[language];

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      users,
      setUsers,
      language,
      setLanguage,
      t,
      activeTab,
      setActiveTab,
      activeSubTab,
      setActiveSubTab,
      customers,
      products,
      orders,
      financeEntries,
      stockMovements,
      auditLogs,
      settings,
      updateSettings,
      createOrder,
      updateOrderStatus,
      recordOrderPayment,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addProduct,
      updateProduct,
      deleteProduct,
      stockIn,
      stockOut,
      addFinanceEntry,
      deleteFinanceEntry,
      syncStatus,
      lastSyncTime,
      selectedOrderForInvoice,
      openInvoiceModal,
      closeInvoiceModal,
      globalSearchQuery,
      setGlobalSearchQuery,
      resetToDefaultData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
