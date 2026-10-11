import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Customer, Product, Order, FinanceEntry, StockMovement, AuditLog, AppSettings } from '../types';

export const DEFAULT_SUPABASE_URL = 'https://odmbxpxoezhpzyxzlntk.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbWJ4cHhvZXpocHp5eHpsbnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NDM4ODEsImV4cCI6MjEwNzMxOTg4MX0.8ytPByynOuxsCdv0ZU9fdaMYRIa6K1bgyfAhpH4Q6rw';

let clientInstance: SupabaseClient | null = null;
let currentConfig = {
  url: '',
  key: '',
};

export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  const effectiveUrl = url || (typeof process !== 'undefined' ? process.env?.SUPABASE_URL : '') || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : '') || DEFAULT_SUPABASE_URL;
  const effectiveKey = key || (typeof process !== 'undefined' ? process.env?.SUPABASE_ANON_KEY : '') || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : '') || DEFAULT_SUPABASE_ANON_KEY;

  if (!effectiveUrl || !effectiveKey) {
    return null;
  }

  if (clientInstance && currentConfig.url === effectiveUrl && currentConfig.key === effectiveKey) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(effectiveUrl, effectiveKey, {
      auth: { persistSession: false },
    });
    currentConfig = { url: effectiveUrl, key: effectiveKey };
    return clientInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export interface SupabaseTestResult {
  success: boolean;
  message: string;
  projectUrl: string;
  tablesDetected: string[];
  latencyMs?: number;
  needsSchemaSetup?: boolean;
}

export async function testSupabaseConnection(url?: string, key?: string): Promise<SupabaseTestResult> {
  const start = Date.now();
  const client = getSupabaseClient(url, key);

  if (!client) {
    return {
      success: false,
      message: 'Supabase URL or Anon Key is missing.',
      projectUrl: url || '',
      tablesDetected: [],
    };
  }

  const detected: string[] = [];
  let connectionVerified = false;
  let schemaMissing = false;

  const tablesToCheck = ['app_state_backup', 'products', 'customers', 'orders', 'stock_movements', 'finance_entries'];

  for (const tbl of tablesToCheck) {
    try {
      const { data, error } = await client.from(tbl).select('*').limit(1);
      if (!error) {
        detected.push(tbl);
        connectionVerified = true;
      } else if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        // Table not created yet, but connection to Supabase itself succeeded!
        connectionVerified = true;
        schemaMissing = true;
      }
    } catch {
      // ignore table check error
    }
  }

  const latency = Date.now() - start;

  if (detected.length > 0) {
    return {
      success: true,
      message: `Connected successfully! Found ${detected.length} active database tables.`,
      projectUrl: currentConfig.url,
      tablesDetected: detected,
      latencyMs: latency,
      needsSchemaSetup: false,
    };
  }

  if (connectionVerified) {
    return {
      success: true,
      message: 'Connected to Supabase project! Database tables need to be created using the provided SQL script.',
      projectUrl: currentConfig.url,
      tablesDetected: [],
      latencyMs: latency,
      needsSchemaSetup: true,
    };
  }

  return {
    success: false,
    message: 'Could not reach Supabase. Please verify project URL and Anon Key.',
    projectUrl: currentConfig.url,
    tablesDetected: [],
    latencyMs: latency,
  };
}

export async function syncDataToSupabase(payload: {
  products?: Product[];
  customers?: Customer[];
  orders?: Order[];
  financeEntries?: FinanceEntry[];
  stockMovements?: StockMovement[];
  auditLogs?: AuditLog[];
  settings?: AppSettings;
  version?: number;
}): Promise<{ success: boolean; syncedTables: string[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, syncedTables: [], error: 'Supabase client not initialized' };

  const synced: string[] = [];

  try {
    // 1. Single-table master backup
    const { error: backupErr } = await client.from('app_state_backup').upsert({
      id: 'gift_city_main',
      data: payload,
      version: payload.version || Date.now(),
      updated_at: new Date().toISOString(),
    });

    if (!backupErr) {
      synced.push('app_state_backup');
    }

    // 2. Products table sync
    if (payload.products && payload.products.length > 0) {
      const mapped = payload.products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku || null,
        category: p.category || 'General',
        description: p.description || '',
        selling_price: p.sellingPrice,
        unit_cost: p.unitCost,
        stock: p.stock,
        low_stock_threshold: p.lowStockThreshold,
        unit: p.unit,
        barcode: p.barcode || null,
        image: p.image || null,
        is_active: p.isActive,
        updated_at: p.updatedAt,
      }));

      const { error: pErr } = await client.from('products').upsert(mapped, { onConflict: 'id' });
      if (!pErr) synced.push('products');
    }

    // 3. Customers table sync
    if (payload.customers && payload.customers.length > 0) {
      const mapped = payload.customers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address || '',
        email: c.email || '',
        notes: c.notes || '',
        total_orders: c.totalOrders,
        total_spent: c.totalSpent,
        due_balance: c.dueBalance,
        updated_at: c.updatedAt,
      }));

      const { error: cErr } = await client.from('customers').upsert(mapped, { onConflict: 'id' });
      if (!cErr) synced.push('customers');
    }

    // 4. Orders table sync
    if (payload.orders && payload.orders.length > 0) {
      const mapped = payload.orders.map(o => ({
        id: o.id,
        customer_id: o.customerId,
        customer_name: o.customerName,
        customer_phone: o.customerPhone,
        customer_address: o.customerAddress || '',
        receiver_name: o.receiverName,
        receiver_phone: o.receiverPhone,
        delivery_address: o.deliveryAddress,
        delivery_date: o.deliveryDate || null,
        delivery_slot: o.deliverySlot,
        items: o.items,
        subtotal: o.subtotal,
        discount: o.discount,
        shipping_cost: o.shippingCost,
        grand_total: o.grandTotal,
        paid_amount: o.paidAmount,
        due_balance: o.dueBalance,
        payment_method: o.paymentMethod,
        payment_status: o.paymentStatus,
        order_status: o.orderStatus,
        stock_deducted: o.stockDeducted,
        created_by: o.createdBy,
        created_by_name: o.createdByName,
        created_at: o.createdAt,
        updated_at: o.updatedAt,
      }));

      const { error: oErr } = await client.from('orders').upsert(mapped, { onConflict: 'id' });
      if (!oErr) synced.push('orders');
    }

    return { success: true, syncedTables: synced };
  } catch (err: any) {
    return { success: false, syncedTables: synced, error: err.message };
  }
}
