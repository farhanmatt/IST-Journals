import { PreventBack } from "@/components/admin/PreventBack";
import { AdminDashboardShell } from "./AdminDashboardShell";
import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions, authSecret } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let session = await getServerSession(authOptions);

  // Fallback: if getServerSession was affected by cookie name differences on Vercel
  if (!session) {
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    const sessionCookie =
      cookieStore.get("__Secure-next-auth.session-token")?.value ||
      cookieStore.get("next-auth.session-token")?.value ||
      allCookies.find((c) => c.name.includes("session-token"))?.value;

    if (sessionCookie) {
      try {
        const decoded = await decode({
          token: sessionCookie,
          secret: authSecret,
        });
        if (decoded && decoded.roles) {
          session = {
            user: {
              id: (decoded.id as string) || "admin",
              name: (decoded.name as string) || "System Administrator",
              email: (decoded.email as string) || "admin@gmail.com",
              roles: (decoded.roles as string[]) || [],
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };
        }
      } catch (err) {
        console.error("Layout session fallback decode error:", err);
      }
    }
  }

  if (!session) {
    redirect("/admin");
  }

  if (!session.user?.roles?.includes("ADMIN")) {
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
