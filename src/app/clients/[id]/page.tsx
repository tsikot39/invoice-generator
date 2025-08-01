import { Metadata } from 'next';
import { auth } from '@/lib/auth-helper';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { ClientDetail } from '@/components/clients/client-detail';

interface ClientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Client Details | Invoice Generator`,
    description: 'View client information and invoice history',
  };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { id } = await params;

  return (
    <AppLayout user={session.user}>
      <ClientDetail clientId={id} />
    </AppLayout>
  );
}
