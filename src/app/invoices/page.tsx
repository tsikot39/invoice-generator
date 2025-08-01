import { Metadata } from "next";
import { auth } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { InvoicesContent } from "@/components/invoices/invoices-content";

export const metadata: Metadata = {
  title: "Invoices | Invoice Generator",
  description: "Manage your invoices and billing",
};

export default async function InvoicesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout user={session.user}>
      <InvoicesContent />
    </AppLayout>
  );
}
