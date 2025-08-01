import { Metadata } from "next";
import { auth } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard | Invoice Generator",
  description: "Invoice generator dashboard with analytics and recent activity",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout user={session.user}>
      <DashboardContent />
    </AppLayout>
  );
}
