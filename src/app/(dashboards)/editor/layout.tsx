import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { EditorSidebarClient } from "./EditorSidebarClient";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCachedUnreadNotificationCount } from "@/lib/cache/layoutCache";

export default async function EditorDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userRoles = session.user.roles || [];
  if (!userRoles.includes("EDITOR") && !userRoles.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const unreadCount = await getCachedUnreadNotificationCount(session.user.id);

  const sidebar = (
    <div className="w-full h-full bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800/80">
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/80 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/25 ring-1 ring-white/20">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white tracking-[0.18em] uppercase">
              Editor Panel
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
              Peer Review Control
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-5 px-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Navigation</p>
        <EditorSidebarClient />
      </div>
    </div>
  );

  return (
    <DashboardShell
      sidebar={sidebar}
      portalName="Editor Panel"
      notificationsHref="/editor/notifications"
      profileHref="/editor/profile"
      unreadCount={unreadCount}
      hasUnread={unreadCount > 0}
      mainClassName="p-4 sm:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </DashboardShell>
  );
}
