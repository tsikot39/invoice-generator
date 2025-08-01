'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useProduct } from '@/hooks/use-api';
import { ProductForm } from './product-form';

interface EditProductContentProps {
  productId: string;
}

export function EditProductContent({ productId }: EditProductContentProps) {
  const router = useRouter();
  const { data: productData, loading, error } = useProduct(productId);

  const handleProductUpdated = () => {
    router.push(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Error loading product</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button asChild className="mt-4">
            <Link href="/products">Back to Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!productData?.product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Product not found</h3>
          <p className="text-muted-foreground">The product you are looking for does not exist.</p>
          <Button asChild className="mt-4">
            <Link href="/products">Back to Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const product = productData.product;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/products/${productId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">Update {product.name}&apos;s information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Update the product&apos;s details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            productId={productId}
            initialData={product}
            onSuccess={handleProductUpdated}
            onCancel={() => router.push(`/products/${productId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
