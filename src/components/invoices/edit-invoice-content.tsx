"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useInvoice } from "@/hooks/use-api";
import { EditInvoiceForm } from "./edit-invoice-form";
import { AlertCircle, Loader2 } from "lucide-react";

interface EditInvoiceContentProps {
  invoiceId: string;
}

export function EditInvoiceContent({ invoiceId }: EditInvoiceContentProps) {
  const router = useRouter();
  const { data, loading, error } = useInvoice(invoiceId);

  const handleSuccess = () => {
    router.push("/invoices");
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading invoice...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <span>Error loading invoice: {error}</span>
        </div>
      </div>
    );
  }

  if (!data?.invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-600">
          <AlertCircle className="h-6 w-6" />
          <span>Invoice not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Invoice</h2>
        <p className="text-muted-foreground">
          Edit invoice {data.invoice.invoiceNumber}
        </p>
      </div>

      <EditInvoiceForm
        invoice={data.invoice}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
