import { Metadata } from "next";
import { auth } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { CreateInvoiceContent } from "@/components/invoices/create-invoice-content";

export const metadata: Metadata = {
  title: "Create Invoice - Invoice Generator",
  description: "Create a new invoice",
};

export default async function CreateInvoicePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout user={session.user}>
      <CreateInvoiceContent />
    </AppLayout>
  );
}
