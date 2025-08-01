import { Metadata } from 'next';
import { auth } from '@/lib/auth-helper';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { EditProductContent } from '@/components/products/edit-product-content';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Edit Product | Invoice Generator`,
    description: `Edit product details`,
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <AppLayout user={session.user}>
      <EditProductContent productId={id} />
    </AppLayout>
  );
}
