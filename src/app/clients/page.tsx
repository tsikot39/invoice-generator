import { Metadata } from "next";
import { auth } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { ClientsContent } from "@/components/clients/clients-content";

export const metadata: Metadata = {
  title: "Clients | Invoice Generator",
  description: "Manage your clients and their information",
};

export default async function ClientsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout user={session.user}>
      <ClientsContent />
    </AppLayout>
  );
}
