export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  dueBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  description?: string;
  sellingPrice: number;
  unitCost: number;
  stock: number;
  lowStockThreshold: number;
  unit: string; // e.g. 'pcs', 'box', 'set'
  barcode?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'bank_transfer' | 'card' | 'other';
export type DeliverySlot = 'anytime' | 'morning' | 'afternoon' | 'evening' | 'specific_time';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  unitCost: number; // cost snapshot at order time
  unitPrice: number; // selling price snapshot at order time
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string; // e.g. 'ORD-2026-00001'
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  sameAsCustomer?: boolean;
  
  deliveryDate: string;
  deliverySlot: DeliverySlot;
  deliveryInstructions?: string;
  
  items: OrderItem[];
  
  subtotal: number;
  discount: number;
  shippingCost: number;
  grandTotal: number;
  paidAmount: number;
  dueBalance: number;
  
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentStatus: PaymentStatus;
  
  orderStatus: OrderStatus;
  stockDeducted: boolean;
  
  createdBy: string;
  createdByName: string;
  createdAt: string;
  createdAtLocal?: string;
  updatedAt: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
  notes?: string;
}

export type StockMovementType = 'stock_in' | 'stock_out' | 'order_deduct' | 'order_restore' | 'adjustment';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  type: StockMovementType;
  quantityIn: number;
  quantityOut: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  reference?: string;
  reason: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
}

export type FinanceType = 'income' | 'expense';

export type ExpenseCategory = 
  | 'product_cost'
  | 'delivery_charge'
  | 'shop_rent'
  | 'home_rent'
  | 'packaging_cost'
  | 'ads_cost'
  | 'utilities_internet'
  | 'employee_salary'
  | 'employee_ta_da'
  | 'office_supplies'
  | 'maintenance'
  | 'other';

export type IncomeCategory = 
  | 'order_sale'
  | 'service_fee'
  | 'wholesale_order'
  | 'investment'
  | 'refund_reversal'
  | 'other';

export interface FinanceEntry {
  id: string;
  type: FinanceType;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  description: string;
  recordedBy: string;
  recordedByName: string;
  date: string;
  notes?: string;
  relatedOrderId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module: 'orders' | 'inventory' | 'finance' | 'customers' | 'system' | 'auth';
  details: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface AppSettings {
  companyName: string;
  tagline: string;
  phone: string;
  address: string;
  currency: string;
  defaultDeliveryFee: number;
  lowStockAlertDefault: number;
  timezone: string;
  logo?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}
