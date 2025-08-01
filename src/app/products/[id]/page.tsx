import { Metadata } from 'next';
import { auth } from '@/lib/auth-helper';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { ProductDetailContent } from '@/components/products/product-detail-content';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Product Details | Invoice Generator`,
    description: `View product details`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <AppLayout user={session.user}>
      <ProductDetailContent productId={id} />
    </AppLayout>
  );
}
