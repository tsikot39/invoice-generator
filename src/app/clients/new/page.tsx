import { Metadata } from "next";
import { auth } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { NewClientContent } from "@/components/clients/new-client-content";

export const metadata: Metadata = {
  title: "Add New Client | Invoice Generator",
  description: "Add a new client to your invoice system",
};

export default async function NewClientPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout user={session.user}>
      <NewClientContent />
    </AppLayout>
  );
}
