import { Metadata } from 'next';
import { auth } from '@/lib/auth-helper';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { EditInvoiceContent } from '@/components/invoices/edit-invoice-content';

export const metadata: Metadata = {
  title: 'Edit Invoice - Invoice Generator',
  description: 'Edit an existing invoice',
};

interface EditInvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <AppLayout user={session.user}>
      <EditInvoiceContent invoiceId={id} />
    </AppLayout>
  );
}
