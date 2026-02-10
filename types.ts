export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface KPIStats {
  dailyRevenue: number;
  monthlyRevenue: number;
  newCustomers: number;
  totalExpenses: number;
  netProfit: number;
  margin: number;
  accountsReceivable: number;
  accountsPayable: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string; // Supplier Name or ID
  costPrice: number;
  price: number;
  stock: number;
  minStock: number;
  unit: string; // un, kg, lt, box
  location?: string; // Shelf A, Bin 2
  status: 'active' | 'inactive';
  lastMovement?: string;
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  user: string;
  reason?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: 'active' | 'inactive';
  lastOrderDate: string;
  // CRM Extended fields
  document?: string; // CPF/CNPJ
  location?: string; // City/State
  segment?: 'VIP' | 'Regular' | 'Novo' | 'Inativo';
  totalSpent?: number;
  purchaseCount?: number;
  notes?: string;
}

export interface PipelineDeal {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  value: number;
  stage: 'lead' | 'contact' | 'proposal' | 'negotiation' | 'closed';
  probability: number;
  expectedDate: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod: 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'boleto';
  total: number;
  items: SaleItem[];
  seller: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDate: string;
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  total: number;
  items: PurchaseItem[];
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  entity: string; // Customer or Supplier Name
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;     // Issue date
  dueDate: string;  // Due date
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paymentMethod: string;
  documentNumber?: string;
}

export interface FinancialRecord {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: 'order' | 'system' | 'alert' | 'finance';
  value?: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

export interface CustomerOrigin {
  source: string;
  count: number;
}

export interface BirthdayProfile {
  id: string;
  name: string;
  date: string; // DD/MM
  type: 'customer' | 'employee';
}

export interface ProjectTask {
  id: string;
  title: string;
  assignee: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  manager: string;
  status: 'ACTIVE' | 'PLANNING' | 'ON_HOLD' | 'COMPLETED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  budget: number;
  spent: number;
  category: string;
  tasks: ProjectTask[];
}

export interface ReportDef {
  id: string;
  title: string;
  description: string;
  module: 'FINANCE' | 'SALES' | 'INVENTORY' | 'CRM' | 'PROJECTS' | 'PURCHASES';
  type: 'PDF' | 'EXCEL' | 'CSV';
  lastGenerated: string;
  favorite: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SELLER' | 'FINANCE';
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin: string;
  avatar?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  timestamp: string;
  ip: string;
}