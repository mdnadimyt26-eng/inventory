-- ========================================================
-- GIFT CITY ERP & INVENTORY MANAGEMENT SYSTEM
-- SUPABASE POSTGRESQL DATABASE SCHEMA
-- Project ID: odmbxpxoezhpzyxzlntk
-- Project URL: https://odmbxpxoezhpzyxzlntk.supabase.co
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. APP STATE BACKUP TABLE (Immediate single-table sync)
CREATE TABLE IF NOT EXISTS public.app_state_backup (
    id TEXT PRIMARY KEY DEFAULT 'gift_city_main',
    data JSONB NOT NULL,
    version BIGINT DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT DEFAULT 'General',
    description TEXT DEFAULT '',
    selling_price NUMERIC(12, 2) DEFAULT 0,
    unit_cost NUMERIC(12, 2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    unit TEXT DEFAULT 'pcs',
    barcode TEXT,
    image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT DEFAULT '',
    email TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(14, 2) DEFAULT 0,
    due_balance NUMERIC(14, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT DEFAULT '',
    receiver_name TEXT,
    receiver_phone TEXT,
    delivery_address TEXT,
    same_as_customer BOOLEAN DEFAULT TRUE,
    delivery_date DATE,
    delivery_slot TEXT DEFAULT 'anytime',
    delivery_instructions TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(14, 2) DEFAULT 0,
    discount NUMERIC(14, 2) DEFAULT 0,
    shipping_cost NUMERIC(14, 2) DEFAULT 0,
    grand_total NUMERIC(14, 2) DEFAULT 0,
    paid_amount NUMERIC(14, 2) DEFAULT 0,
    due_balance NUMERIC(14, 2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    payment_reference TEXT,
    payment_status TEXT DEFAULT 'unpaid',
    order_status TEXT DEFAULT 'confirmed',
    stock_deducted BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    created_by_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    notes TEXT
);

-- 5. STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    sku TEXT,
    type TEXT NOT NULL,
    quantity_in INTEGER DEFAULT 0,
    quantity_out INTEGER DEFAULT 0,
    previous_stock INTEGER DEFAULT 0,
    new_stock INTEGER DEFAULT 0,
    unit_cost NUMERIC(12, 2) DEFAULT 0,
    reference TEXT,
    reason TEXT,
    recorded_by TEXT,
    recorded_by_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. FINANCE ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.finance_entries (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    reference TEXT,
    description TEXT,
    order_id TEXT,
    recorded_by TEXT,
    recorded_by_name TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    company_name TEXT DEFAULT 'Gift City Bangladesh',
    tagline TEXT DEFAULT 'Choose The Best',
    phone TEXT,
    address TEXT,
    currency TEXT DEFAULT '৳',
    default_delivery_fee NUMERIC(10, 2) DEFAULT 80,
    low_stock_alert_default INTEGER DEFAULT 5,
    timezone TEXT DEFAULT 'Asia/Dhaka',
    logo TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Allows the app (using the public anon key) full read/write access
-- ========================================================

ALTER TABLE public.app_state_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Anon full access on app_state_backup" ON public.app_state_backup;
DROP POLICY IF EXISTS "Anon full access on products" ON public.products;
DROP POLICY IF EXISTS "Anon full access on customers" ON public.customers;
DROP POLICY IF EXISTS "Anon full access on orders" ON public.orders;
DROP POLICY IF EXISTS "Anon full access on stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Anon full access on finance_entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Anon full access on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Anon full access on app_settings" ON public.app_settings;

-- Create policies for anon role
CREATE POLICY "Anon full access on app_state_backup" ON public.app_state_backup FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access on products" ON public.products FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access on customers" ON public.customers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access on orders" ON public.orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access on stock_movements" ON public.stock_movements FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access on finance_entries" ON public.finance_entries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access on audit_logs" ON public.audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access on app_settings" ON public.app_settings FOR ALL TO anon USING (true) WITH CHECK (true);
