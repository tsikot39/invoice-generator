"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { InvoiceForm } from "./invoice-form-enhanced";

export function CreateInvoiceContent() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/invoices");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
        <p className="text-muted-foreground">
          Create a new invoice for your client
        </p>
      </div>

      <InvoiceForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
