import { Customer, Product, Order, FinanceEntry, StockMovement, User, AppSettings, AuditLog } from '../types';

export const initialUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Md Nadim',
    email: 'mdnadimyt26@gmail.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    phone: '+880 1711-234567',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-2',
    name: 'Tanvir Ahmed',
    email: 'tanvir.manager@giftcity.com',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    phone: '+880 1819-876543',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-3',
    name: 'Sharmin Sultana',
    email: 'sharmin.sales@giftcity.com',
    role: 'staff',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    phone: '+880 1912-345678',
    createdAt: new Date().toISOString(),
  }
];

export const initialSettings: AppSettings = {
  companyName: 'Gift City Bangladesh',
  tagline: 'Choose The Best',
  phone: '+880 1711-234567',
  address: '216/1, Beside of Top Ten Bata Signal, Elephant Rd, Dhaka 1205, Dhaka, Bangladesh, 1205',
  currency: '৳',
  defaultDeliveryFee: 80,
  lowStockAlertDefault: 5,
  timezone: 'Asia/Dhaka',
  logo: '/gift_city_logo.jpg',
  supabaseUrl: 'https://odmbxpxoezhpzyxzlntk.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbWJ4cHhvZXpocHp5eHpsbnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NDM4ODEsImV4cCI6MjEwNzMxOTg4MX0.8ytPByynOuxsCdv0ZU9fdaMYRIa6K1bgyfAhpH4Q6rw',
};

// All demo collections cleared as requested
export const initialCustomers: Customer[] = [];

export const initialProducts: Product[] = [];

export const initialOrders: Order[] = [];

export const initialFinanceEntries: FinanceEntry[] = [];

export const initialStockMovements: StockMovement[] = [];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    action: 'SYSTEM_BOOT',
    module: 'system',
    details: 'Gift City Inventory engine initialized with clean database and live multi-device sync.',
    userId: 'usr-1',
    userName: 'Md Nadim',
    timestamp: new Date().toISOString(),
  }
];
