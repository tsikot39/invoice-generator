import mongoose, { Schema, Document } from "mongoose";
import { User, Client, Product, Invoice } from "@/types";

// User Model
interface UserDocument extends Omit<User, "id">, Document {}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  {
    timestamps: true,
  }
);

export const UserModel =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

// Client Model
interface ClientDocument extends Omit<Client, "id">, Document {}

const ClientSchema = new Schema<ClientDocument>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

ClientSchema.index({ userId: 1 });
ClientSchema.index({ name: 1 });

export const ClientModel =
  mongoose.models.Client ||
  mongoose.model<ClientDocument>("Client", ClientSchema);

// Product Model
interface ProductDocument extends Omit<Product, "id">, Document {}

const ProductSchema = new Schema<ProductDocument>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    unitPrice: { type: Number, required: true, min: 0 },
    category: { type: String },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ userId: 1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });

export const ProductModel =
  mongoose.models.Product ||
  mongoose.model<ProductDocument>("Product", ProductSchema);

// Invoice Model
interface InvoiceDocument extends Omit<Invoice, "id">, Document {}

const InvoiceItemSchema = new Schema(
  {
    productId: { type: String },
    name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<InvoiceDocument>(
  {
    userId: { type: String, required: true },
    clientId: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "void"],
      default: "draft",
    },
    items: [InvoiceItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    discountType: { type: String, enum: ["percentage", "fixed"] },
    discountValue: { type: Number, min: 0 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String },
    termsAndConditions: { type: String },
    paidAt: { type: Date },
    sentAt: { type: Date },
    remindersSent: [
      {
        type: { type: String, enum: ["overdue"], required: true },
        sentAt: { type: Date, required: true },
        daysOverdue: { type: Number, required: true },
      },
    ],
    lastReminderSent: { type: Date },
  },
  {
    timestamps: true,
  }
);

InvoiceSchema.index({ userId: 1 });
InvoiceSchema.index({ clientId: 1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ issueDate: -1 });
InvoiceSchema.index({ dueDate: 1 });

export const InvoiceModel =
  mongoose.models.Invoice ||
  mongoose.model<InvoiceDocument>("Invoice", InvoiceSchema);
