import { Metadata } from "next";
import { auth } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { ProductsContent } from "@/components/products/products-content";

export const metadata: Metadata = {
  title: "Products | Invoice Generator",
  description: "Manage your products and services",
};

export default async function ProductsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout user={session.user}>
      <ProductsContent />
    </AppLayout>
  );
}
