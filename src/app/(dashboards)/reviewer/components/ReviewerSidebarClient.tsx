"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, FileText, CheckCircle } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/reviewer/dashboard", icon: LayoutDashboard },
  { label: "Invitations", href: "/reviewer/invitations", icon: Inbox },
  { label: "Assigned Manuscripts", href: "/reviewer/assigned", icon: FileText },
  { label: "Completed Reviews", href: "/reviewer/completed", icon: CheckCircle },
];

export function ReviewerSidebarClient({ user }: { user?: { name?: string | null; email?: string | null } } = {}) {
  const pathname = usePathname();

  return (
    <div className="w-full h-full bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800 shrink-0">
        <BookOpenIcon className="w-6 h-6 text-blue-500 mr-3" />
        <span className="font-bold text-white tracking-wide">Reviewer Panel</span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Navigation</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 mr-3 ${isActive ? "text-white" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function BookOpenIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

