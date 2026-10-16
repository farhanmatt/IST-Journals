"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  CheckCircle, 
  BookMarked,
  Printer
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/production/dashboard", icon: LayoutDashboard },
  { label: "Assigned Manuscripts", href: "/production/assigned", icon: FileText },
  { label: "Pending Production", href: "/production/pending", icon: Clock },
  { label: "Completed Production", href: "/production/completed", icon: CheckCircle },
  { label: "Issues & Publication", href: "/production/issues", icon: BookMarked },
];

export function ProductionSidebarClient({ user }: { user?: { name?: string | null; email?: string | null } } = {}) {
  const pathname = usePathname();

  return (
    <div className="w-full h-full bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800 shrink-0">
        <Printer className="w-6 h-6 text-indigo-500 mr-3" />
        <span className="font-bold text-white tracking-wide">Production Editor</span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Navigation</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/production/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.label}
                href={item.href}
                prefetch={true}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-indigo-200" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
