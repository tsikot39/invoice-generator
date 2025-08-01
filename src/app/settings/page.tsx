import { Metadata } from "next";
import { auth } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { SettingsContent } from "@/components/settings/settings-content";

export const metadata: Metadata = {
  title: "Settings - Invoice Generator",
  description: "Application settings and preferences",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout user={session.user}>
      <SettingsContent />
    </AppLayout>
  );
}
