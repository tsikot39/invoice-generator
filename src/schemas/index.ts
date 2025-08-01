import { z } from "zod";

// User schemas
export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "user"]).default("user"),
});

// Client schemas
export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

export const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: addressSchema.optional(),
});

export const createClientSchema = clientSchema;
export const updateClientSchema = clientSchema.partial();

// Product schemas
export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  category: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
});

export const createProductSchema = productSchema;
export const updateProductSchema = productSchema.partial();

// Invoice item schema
export const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  taxRate: z.number().min(0).max(100).default(0),
  total: z.number().min(0),
});

// Invoice schemas
export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.date(),
  dueDate: z.date(),
  status: z.enum(["draft", "sent", "paid", "overdue", "void"]).default("draft"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0).optional(),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().min(0).optional(),
  total: z.number().min(0),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
});

export const createInvoiceSchema = invoiceSchema;
export const updateInvoiceSchema = invoiceSchema.partial();

// Form schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const searchSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  clientId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

// Type exports
export type CreateClientData = z.infer<typeof createClientSchema>;
export type UpdateClientData = z.infer<typeof updateClientSchema>;
export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
export type CreateInvoiceData = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceData = z.infer<typeof updateInvoiceSchema>;
export type InvoiceItemData = z.infer<typeof invoiceItemSchema>;
export type SearchData = z.infer<typeof searchSchema>;
