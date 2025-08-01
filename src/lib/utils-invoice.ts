import { InvoiceItem } from "@/types";

// Invoice calculations
export function calculateItemTotal(item: Omit<InvoiceItem, "total">): number {
  const subtotal = item.quantity * item.unitPrice;
  const taxAmount = subtotal * ((item.taxRate || 0) / 100);
  return subtotal + taxAmount;
}

export function calculateInvoiceSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    return sum + itemSubtotal;
  }, 0);
}

export function calculateInvoiceTax(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const taxAmount = itemSubtotal * ((item.taxRate || 0) / 100);
    return sum + taxAmount;
  }, 0);
}

export function calculateInvoiceTotal(
  items: InvoiceItem[],
  discountAmount = 0
): number {
  const subtotal = calculateInvoiceSubtotal(items);
  const tax = calculateInvoiceTax(items);
  return Math.max(0, subtotal + tax - discountAmount);
}

export function calculateDiscount(
  subtotal: number,
  discountType: "percentage" | "fixed",
  discountValue: number
): number {
  if (discountType === "percentage") {
    return (subtotal * discountValue) / 100;
  }
  return Math.min(discountValue, subtotal);
}

// Invoice number generation
export function generateInvoiceNumber(prefix = "INV", lastNumber = 0): string {
  const nextNumber = lastNumber + 1;
  const paddedNumber = nextNumber.toString().padStart(4, "0");
  return `${prefix}-${paddedNumber}`;
}

// Date utilities
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Status utilities
export function getInvoiceStatus(
  currentStatus: string,
  dueDate: Date,
  paidAt?: Date
): "draft" | "sent" | "paid" | "overdue" | "void" {
  if (paidAt) return "paid";
  if (currentStatus === "void") return "void";
  if (currentStatus === "draft") return "draft";

  const today = new Date();
  const due = new Date(dueDate);

  if (today > due) return "overdue";
  return "sent";
}

// Form validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
}

// API response helpers
export function createApiResponse<T>(
  data: T,
  message = "Success",
  status = 200
) {
  return {
    success: status >= 200 && status < 300,
    data,
    message,
    status,
  };
}

export function createApiError(
  message: string,
  status = 400,
  errors?: Record<string, string[]>
) {
  return {
    success: false,
    message,
    status,
    errors,
  };
}
