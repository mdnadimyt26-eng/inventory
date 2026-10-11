import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  initialCustomers, 
  initialProducts, 
  initialOrders, 
  initialFinanceEntries, 
  initialStockMovements, 
  initialAuditLogs, 
  initialSettings, 
  initialUsers 
} from './src/data/initialData.ts';

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://odmbxpxoezhpzyxzlntk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbWJ4cHhvZXpocHp5eHpsbnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NDM4ODEsImV4cCI6MjEwNzMxOTg4MX0.8ytPByynOuxsCdv0ZU9fdaMYRIa6K1bgyfAhpH4Q6rw';

let supabaseClient: any = null;
try {
  if (SUPABASE_URL && SUPABASE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
    console.log(`✅ Supabase backend client initialized for ${SUPABASE_URL}`);
  }
} catch (e) {
  console.error('Failed to initialize Supabase client in server:', e);
}

// Enable CORS for any connecting client / device
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.resolve(__dirname, 'public')));

// Ensure data folder exists for permanent JSON database storage
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'giftcity_db.json');

interface DatabaseSchema {
  users: typeof initialUsers;
  customers: typeof initialCustomers;
  products: typeof initialProducts;
  orders: typeof initialOrders;
  financeEntries: typeof initialFinanceEntries;
  stockMovements: typeof initialStockMovements;
  auditLogs: typeof initialAuditLogs;
  settings: typeof initialSettings;
  version: number;
  lastUpdated: string;
}

const getInitialData = (): DatabaseSchema => ({
  users: initialUsers,
  customers: initialCustomers,
  products: initialProducts,
  orders: initialOrders,
  financeEntries: initialFinanceEntries,
  stockMovements: initialStockMovements,
  auditLogs: initialAuditLogs,
  settings: initialSettings,
  version: 1,
  lastUpdated: new Date().toISOString(),
});

// Load or initialize DB from disk
const loadDB = (): DatabaseSchema => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return {
          users: parsed.users || initialUsers,
          customers: parsed.customers || initialCustomers,
          products: parsed.products || initialProducts,
          orders: parsed.orders || initialOrders,
          financeEntries: parsed.financeEntries || initialFinanceEntries,
          stockMovements: parsed.stockMovements || initialStockMovements,
          auditLogs: parsed.auditLogs || initialAuditLogs,
          settings: parsed.settings || initialSettings,
          version: parsed.version || 1,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.error('Failed to read db file, initializing with defaults:', err);
  }
  const defaults = getInitialData();
  saveDB(defaults);
  return defaults;
};

// Save DB to disk permanently
const saveDB = (data: DatabaseSchema) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file:', err);
  }
};

let db: DatabaseSchema = loadDB();

// SSE Connected Clients (cross-device real-time push)
const sseClients = new Set<Response>();

const broadcastToAll = (payload: { type: string; data: Partial<DatabaseSchema>; version: number; timestamp: string }) => {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
};

// Heartbeat ping to keep SSE connections open across mobile networks
setInterval(() => {
  const ping = `: ping\n\n`;
  for (const client of sseClients) {
    try {
      client.write(ping);
    } catch {
      sseClients.delete(client);
    }
  }
}, 10000);

// API Endpoints
app.get('/api/data', (_req: Request, res: Response) => {
  res.json({ 
    success: true, 
    db, 
    version: db.version || 1, 
    lastUpdated: db.lastUpdated || new Date().toISOString() 
  });
});

app.post('/api/sync', (req: Request, res: Response) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ success: false, error: 'Invalid data payload' });
      return;
    }

    db = {
      ...db,
      ...incoming,
      version: (db.version || 1) + 1,
      lastUpdated: new Date().toISOString(),
    };

    saveDB(db);

    // Notify ALL connected devices immediately in real time
    broadcastToAll({
      type: 'SYNC_UPDATE',
      data: db,
      version: db.version,
      timestamp: db.lastUpdated,
    });

    // Asynchronously push to Supabase in background
    if (supabaseClient) {
      (async () => {
        try {
          await supabaseClient.from('app_state_backup').upsert({
            id: 'gift_city_main',
            data: db,
            version: db.version,
            updated_at: db.lastUpdated,
          });

          if (db.products?.length) {
            const productsPayload = db.products.map(p => ({
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
              is_active: p.isActive,
              updated_at: p.updatedAt,
            }));
            await supabaseClient.from('products').upsert(productsPayload, { onConflict: 'id' });
          }

          if (db.customers?.length) {
            const customersPayload = db.customers.map(c => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              address: c.address || '',
              email: c.email || '',
              total_orders: c.totalOrders,
              total_spent: c.totalSpent,
              due_balance: c.dueBalance,
              updated_at: c.updatedAt,
            }));
            await supabaseClient.from('customers').upsert(customersPayload, { onConflict: 'id' });
          }

          if (db.orders?.length) {
            const ordersPayload = db.orders.map(o => ({
              id: o.id,
              customer_id: o.customerId,
              customer_name: o.customerName,
              customer_phone: o.customerPhone,
              customer_address: o.customerAddress || '',
              receiver_name: o.receiverName,
              receiver_phone: o.receiverPhone,
              delivery_address: o.deliveryAddress,
              items: o.items,
              grand_total: o.grandTotal,
              paid_amount: o.paidAmount,
              due_balance: o.dueBalance,
              order_status: o.orderStatus,
              payment_status: o.paymentStatus,
              created_at: o.createdAt,
              updated_at: o.updatedAt,
            }));
            await supabaseClient.from('orders').upsert(ordersPayload, { onConflict: 'id' });
          }
        } catch (e: any) {
          // Log without interrupting local fast sync
          console.log('Supabase sync note:', e.message);
        }
      })();
    }

    res.json({ success: true, version: db.version, lastUpdated: db.lastUpdated, supabaseConnected: Boolean(supabaseClient) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test connection to Supabase
app.post('/api/supabase/test', async (req: Request, res: Response) => {
  const url = req.body?.url || SUPABASE_URL;
  const key = req.body?.key || SUPABASE_KEY;

  if (!url || !key) {
    res.status(400).json({ success: false, message: 'URL and Anon Key are required' });
    return;
  }

  try {
    const testClient = createClient(url, key, { auth: { persistSession: false } });
    const detected: string[] = [];
    let schemaMissing = false;

    const tables = ['app_state_backup', 'products', 'customers', 'orders', 'stock_movements', 'finance_entries'];
    for (const t of tables) {
      const { error } = await testClient.from(t).select('*').limit(1);
      if (!error) {
        detected.push(t);
      } else if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        schemaMissing = true;
      }
    }

    res.json({
      success: true,
      projectUrl: url,
      tablesDetected: detected,
      needsSchemaSetup: schemaMissing && detected.length === 0,
      message: detected.length > 0
        ? `Connected! Found ${detected.length} active tables: ${detected.join(', ')}`
        : 'Successfully reached Supabase project! Ready for schema execution in SQL Editor.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Force manual sync to Supabase
app.post('/api/supabase/sync-now', async (_req: Request, res: Response) => {
  if (!supabaseClient) {
    res.status(400).json({ success: false, message: 'Supabase client is not configured' });
    return;
  }

  try {
    const { error: bErr } = await supabaseClient.from('app_state_backup').upsert({
      id: 'gift_city_main',
      data: db,
      version: db.version,
      updated_at: new Date().toISOString(),
    });

    const tablesSynced: string[] = [];
    if (!bErr) tablesSynced.push('app_state_backup');

    if (db.products?.length) {
      const { error } = await supabaseClient.from('products').upsert(db.products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku || null,
        selling_price: p.sellingPrice,
        unit_cost: p.unitCost,
        stock: p.stock,
      })), { onConflict: 'id' });
      if (!error) tablesSynced.push('products');
    }

    res.json({
      success: true,
      syncedTables: tablesSynced,
      message: tablesSynced.length > 0
        ? `Successfully synced to Supabase (${tablesSynced.join(', ')})!`
        : 'Push attempted. Note: Run the SQL schema script in Supabase if tables do not exist yet.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// SSE Live Stream for all devices
app.get('/api/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connection state immediately to client
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', data: db, version: db.version, timestamp: new Date().toISOString() })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.post('/api/reset', (_req: Request, res: Response) => {
  db = getInitialData();
  saveDB(db);
  broadcastToAll({
    type: 'SYNC_UPDATE',
    data: db,
    version: db.version,
    timestamp: db.lastUpdated,
  });
  res.json({ success: true, db });
});

// Vite Middleware for Full-stack Dev or Static Serve for Prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicit SPA HTML handler for Vite middleware mode
    app.use('*', async (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Gift City Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
