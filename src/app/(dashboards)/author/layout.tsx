import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCachedUnreadNotificationCount } from "@/lib/cache/layoutCache";
import { AuthorSidebarClient } from "./AuthorSidebarClient";

export default async function AuthorLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.roles?.includes("AUTHOR")) {
    redirect("/unauthorized");
  }

  const unreadCount = await getCachedUnreadNotificationCount(session.user.id);

  const sidebar = (
    <div className="w-full h-full bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950 shrink-0">
        <BookOpen className="h-6 w-6 text-blue-500 mr-3" />
        <span className="font-bold text-lg text-white leading-tight">Author Portal</span>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="mb-6 px-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Navigation</p>
          <AuthorSidebarClient />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardShell
      sidebar={sidebar}
      portalName="Author Portal"
      notificationsHref="/author/notifications"
      profileHref="/author/profile"
      unreadCount={unreadCount}
      hasUnread={unreadCount > 0}
      mainClassName="p-4 sm:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-6xl">
        {children}
      </div>
    </DashboardShell>
  );
}
