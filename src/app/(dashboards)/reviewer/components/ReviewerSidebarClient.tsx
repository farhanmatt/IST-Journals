"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, FileText, CheckCircle, ClipboardCheck } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/reviewer/dashboard", icon: LayoutDashboard },
  { label: "Invitations", href: "/reviewer/invitations", icon: Inbox },
  { label: "Assigned Manuscripts", href: "/reviewer/assigned", icon: FileText },
  { label: "Completed Reviews", href: "/reviewer/completed", icon: CheckCircle },
];

export function ReviewerSidebarClient({ user }: { user?: { name?: string | null; email?: string | null } } = {}) {
  const pathname = usePathname();

  return (
    <div className="w-full h-full bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800/80">
      <div className="h-16 flex items-center px-6 bg-slate-950/80 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/25 ring-1 ring-white/20">
            <ClipboardCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white tracking-[0.18em] uppercase">
              Reviewer Panel
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
              Expert Evaluation
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-5 px-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Navigation</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/reviewer/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-500/25 ring-1 ring-white/10"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
