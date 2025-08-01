import { Metadata } from 'next';
import { auth } from '@/lib/auth-helper';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { EditClientContent } from '@/components/clients/edit-client-content';

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Edit Client | Invoice Generator`,
    description: `Edit client details`,
  };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <AppLayout user={session.user}>
      <EditClientContent clientId={id} />
    </AppLayout>
  );
}
