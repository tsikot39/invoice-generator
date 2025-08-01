import { Metadata } from "next";
import { auth } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { InvoiceView } from "@/components/invoices";

interface InvoiceViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Invoice Details | Invoice Generator`,
    description: "View invoice details and information",
  };
}

export default async function InvoiceViewPage({
  params,
}: InvoiceViewPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  return (
    <AppLayout user={session.user}>
      <InvoiceView invoiceId={id} />
    </AppLayout>
  );
}
