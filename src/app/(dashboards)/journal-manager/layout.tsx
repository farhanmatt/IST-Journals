import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, LogOut, Settings, LayoutDashboard, Users, FileText, Layers, FileSignature, Globe, BarChart2, Bell } from "lucide-react";
import { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCachedUnreadNotificationCount } from "@/lib/cache/layoutCache";

export default async function JournalManagerLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.roles?.includes("JOURNAL_MANAGER") && !session.user?.roles?.includes("ADMIN")) {
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
    <div className="w-full h-full bg-white text-slate-900 flex flex-col border-r border-slate-200">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
        <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
        <span className="font-bold text-lg text-slate-900 leading-tight">IST Journals<br/><span className="text-xs font-normal text-slate-500">Journal Manager</span></span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
          >
            <item.icon className="h-5 w-5 text-slate-400 group-hover:text-blue-600" />
            <span>{item.name}</span>
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
      <div className="mx-auto max-w-6xl">
        {children}
      </div>
    </DashboardShell>
  );
}
