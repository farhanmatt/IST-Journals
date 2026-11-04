import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, LogOut, Settings, LayoutDashboard, Users, Layers, FileSignature, Globe, BarChart2 } from "lucide-react";
import { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCachedUnreadNotificationCount } from "@/lib/cache/layoutCache";

export default async function JournalManagerLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || (!session.user?.roles?.includes("JOURNAL_MANAGER") && !session.user?.roles?.includes("ADMIN"))) {
    redirect("/unauthorized");
  }

  const unreadCount = session?.user?.id ? await getCachedUnreadNotificationCount(session.user.id) : 0;

  const menuItems = [
    { name: "Dashboard", href: "/journal-manager/dashboard", icon: LayoutDashboard },
    { name: "Editorial Team", href: "/journal-manager/editorial-team", icon: Users },
    { name: "Journal Sections", href: "/journal-manager/sections", icon: Layers },
    { name: "Submissions", href: "/journal-manager/submissions", icon: FileSignature },
    { name: "Issues & Pubs", href: "/journal-manager/issues", icon: BookOpen },
    { name: "Website Content", href: "/journal-manager/website-content", icon: Globe },
    { name: "Reports & Analytics", href: "/journal-manager/reports", icon: BarChart2 },
    { name: "Journal Settings", href: "/journal-manager/settings", icon: Settings },
  ];

  const sidebar = (
    <div className="w-full h-full bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800/80">
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/80 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/25 ring-1 ring-white/20">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white tracking-[0.18em] uppercase">
              Manager Panel
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
              Journal Operations
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Navigation</p>
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:bg-slate-800/70 hover:text-white transition-all group"
          >
            <item.icon className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors shrink-0" />
            <span className="truncate">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <DashboardShell
      sidebar={sidebar}
      portalName="Journal Manager"
      notificationsHref="/journal-manager/notifications"
      profileHref="/journal-manager/profile"
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
