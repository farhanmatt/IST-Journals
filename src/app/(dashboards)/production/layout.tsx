import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductionSidebarClient } from "./components/ProductionSidebarClient";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCachedProductionCounts } from "@/lib/cache/layoutCache";

export default async function ProductionEditorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!session.user.roles.includes("PRODUCTION_EDITOR") && !session.user.roles.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const { assignedCount, unreadNotifs } = await getCachedProductionCounts(session.user.id);

  return (
    <DashboardShell
      sidebar={<ProductionSidebarClient user={session.user} />}
      portalName="Production Editor Panel"
      notificationsHref="/production/notifications"
      profileHref="/production/profile"
      unreadCount={unreadNotifs || assignedCount}
      hasUnread={(unreadNotifs || assignedCount) > 0}
      mainClassName="p-4 sm:p-6 lg:p-8"
    >
      {children}
    </DashboardShell>
  );
}
