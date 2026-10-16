import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CopyEditorSidebarClient } from "./components/CopyEditorSidebarClient";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCachedCopyeditorCounts } from "@/lib/cache/layoutCache";

export default async function CopyEditorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!session.user.roles.includes("COPYEDITOR") && !session.user.roles.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const { assignedCount, unreadNotifs } = await getCachedCopyeditorCounts(session.user.id);

  return (
    <DashboardShell
      sidebar={<CopyEditorSidebarClient user={session.user} />}
      portalName="Copy Editor Panel"
      notificationsHref="/copyeditor/notifications"
      profileHref="/copyeditor/profile"
      unreadCount={unreadNotifs || assignedCount}
      hasUnread={(unreadNotifs || assignedCount) > 0}
      mainClassName="p-4 sm:p-6 lg:p-8"
    >
      {children}
    </DashboardShell>
  );
}
