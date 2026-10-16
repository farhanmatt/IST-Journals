import { PreventBack } from "@/components/admin/PreventBack";
import { AdminDashboardShell } from "./AdminDashboardShell";
import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.roles?.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  return (
    <>
      <PreventBack />
      <AdminDashboardShell>
        {children}
      </AdminDashboardShell>
    </>
  );
}
