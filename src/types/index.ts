export interface User {
  id: string;
  name?: string;
  email: string;
  image?: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  company?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  description?: string;
  unitPrice: number;
  category?: string;
  taxRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  total: number;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  clientName?: string; // Added for populated client name
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  total: number;
  notes?: string;
  termsAndConditions?: string;
  paidAt?: Date;
  sentAt?: Date;
  remindersSent?: Array<{
    type: "overdue";
    sentAt: Date;
    daysOverdue: number;
  }>;
  lastReminderSent?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalInvoices: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  recentInvoices: Invoice[];
}
