"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Download,
  Send,
  Eye,
  Calendar,
  User,
  Building2,
  FileText,
  DollarSign,
  Mail,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils-invoice";
import { downloadInvoicePDF, getInvoicePDFBlob } from "@/lib/pdf-generator";
import { getCompanyInfo } from "@/lib/settings-helper";
import { toast } from "sonner";
import { StatusUpdateDropdown } from "./status-update-dropdown";
import { useSendOverdueReminders } from "@/hooks/use-api";

interface InvoiceItem {
  id?: string;
  productId?: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  company?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string;
  client?: Client;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceViewProps {
  invoiceId: string;
}

export function InvoiceView({ invoiceId }: InvoiceViewProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const { sendReminders, loading: sendingReminder } = useSendOverdueReminders();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`);
        if (response.ok) {
          const data = await response.json();
          setInvoice(data.data.invoice);
        } else {
          console.error("Failed to fetch invoice");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const handleDownload = async () => {
    if (!invoice) {
      alert("Invoice data not available");
      return;
    }

    if (!invoice.client) {
      alert("Client information not available for this invoice");
      return;
    }

    try {
      // Get company info from settings
      const companyInfo = await getCompanyInfo();

      // Generate and download PDF
      downloadInvoicePDF({
        invoice: {
          ...invoice,
          userId: "",
          issueDate: new Date(invoice.issueDate),
          dueDate: new Date(invoice.dueDate),
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.updatedAt),
        },
        client: {
          ...invoice.client,
          userId: "",
          createdAt: new Date(),
          updatedAt: new Date(),
          address: invoice.client.address || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
        },
        companyInfo,
      });
    } catch (error) {
      console.error("Failed to download invoice:", error);
      alert("Failed to download invoice. Please try again.");
    }
  };

  const handlePreview = async () => {
    if (!invoice) {
      alert("Invoice data not available");
      return;
    }

    if (!invoice.client) {
      alert("Client information not available for this invoice");
      return;
    }

    try {
      // Get company info from settings
      const companyInfo = await getCompanyInfo();

      // Generate PDF blob
      const blob = getInvoicePDFBlob({
        invoice: {
          ...invoice,
          userId: "",
          issueDate: new Date(invoice.issueDate),
          dueDate: new Date(invoice.dueDate),
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.updatedAt),
        },
        client: {
          ...invoice.client,
          userId: "",
          createdAt: new Date(),
          updatedAt: new Date(),
          address: invoice.client.address || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
        },
        companyInfo,
      });

      // Create URL and open in new tab
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up the URL after a delay to prevent memory leaks
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Failed to preview invoice:", error);
      alert("Failed to preview invoice. Please try again.");
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice) {
      toast.error("Invoice data not available");
      return;
    }

    if (!invoice.client?.email) {
      toast.error(
        "Client email not found. Please add an email address to the client."
      );
      return;
    }

    try {
      const response = await fetch("/api/email-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Invoice sent successfully to ${invoice.client.email}`);
        // Optionally refresh the invoice data to show updated status
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to send invoice");
      }
    } catch (error) {
      console.error("Failed to send invoice:", error);
      toast.error("Failed to send invoice. Please try again.");
    }
  };

  const handleSendReminder = async () => {
    if (!invoice) {
      toast.error("Invoice data not available");
      return;
    }

    if (invoice.status !== "overdue") {
      toast.error("Can only send reminders for overdue invoices");
      return;
    }

    if (!invoice.client?.email) {
      toast.error(
        "Client email not found. Please add an email address to the client."
      );
      return;
    }

    try {
      await sendReminders(invoice.id);
      toast.success(
        `Overdue reminder sent successfully to ${invoice.client.email}`
      );
    } catch (error) {
      console.error("Failed to send reminder:", error);
      toast.error("Failed to send reminder. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-80 bg-gray-200 rounded"></div>
              <div className="h-60 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invoice Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The invoice you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild className="cursor-pointer">
            <Link href="/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Invoice {invoice.invoiceNumber}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <StatusUpdateDropdown
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoiceNumber}
                currentStatus={invoice.status}
                onStatusUpdate={() => {
                  // Refetch invoice data
                  window.location.reload();
                }}
              />
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Created {formatDate(new Date(invoice.createdAt))}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="cursor-pointer"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendInvoice}
            className="cursor-pointer"
          >
            <Send className="mr-2 h-4 w-4" />
            Send Invoice
          </Button>
          {invoice.status === "overdue" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReminder}
              disabled={sendingReminder}
              className="cursor-pointer border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              {sendingReminder ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Send Reminder
                </>
              )}
            </Button>
          )}
          <Button variant="outline" asChild className="cursor-pointer">
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Invoice Number
                  </label>
                  <p className="text-lg font-semibold">
                    {invoice.invoiceNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <StatusUpdateDropdown
                      invoiceId={invoice.id}
                      invoiceNumber={invoice.invoiceNumber}
                      currentStatus={invoice.status}
                      onStatusUpdate={() => {
                        // Refetch invoice data
                        window.location.reload();
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Issue Date
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(new Date(invoice.issueDate))}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Due Date
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(new Date(invoice.dueDate))}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Bill To
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {invoice.clientName ||
                    invoice.client?.name ||
                    "Unknown Client"}
                </h3>
                {invoice.client && (
                  <div className="space-y-1 text-muted-foreground">
                    {invoice.client.company && (
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>{invoice.client.company}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{invoice.client.email}</span>
                    </div>
                    {invoice.client.address && (
                      <div className="space-y-1">
                        {invoice.client.address.street && (
                          <p>{invoice.client.address.street}</p>
                        )}
                        {(invoice.client.address.city ||
                          invoice.client.address.state ||
                          invoice.client.address.zipCode) && (
                          <p>
                            {[
                              invoice.client.address.city,
                              invoice.client.address.state,
                              invoice.client.address.zipCode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                        {invoice.client.address.country && (
                          <p>{invoice.client.address.country}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.items.map((item, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span>Qty: {item.quantity}</span>
                          <span>Rate: {formatCurrency(item.unitPrice)}</span>
                          {item.taxRate > 0 && (
                            <span>Tax: {item.taxRate}%</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full cursor-pointer"
                variant="outline"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button
                className="w-full cursor-pointer"
                variant="outline"
                onClick={handleSendInvoice}
              >
                <Send className="mr-2 h-4 w-4" />
                Send to Client
              </Button>
              <Button
                className="w-full cursor-pointer"
                variant="outline"
                asChild
              >
                <Link href={`/invoices/${invoice.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Invoice
                </Link>
              </Button>
              <Button
                className="w-full cursor-pointer"
                variant="outline"
                onClick={handlePreview}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </CardContent>
          </Card>

          {/* Invoice Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Invoice Created</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(new Date(invoice.createdAt))}
                  </p>
                </div>
              </div>
              {invoice.status === "sent" && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Invoice Sent</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(invoice.updatedAt))}
                    </p>
                  </div>
                </div>
              )}
              {invoice.status === "paid" && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payment Received</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(invoice.updatedAt))}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
