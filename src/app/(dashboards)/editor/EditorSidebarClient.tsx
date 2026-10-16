"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FilePlus, Search, Users, Eye, CheckSquare, BookOpen, Edit, Archive, Bell, User, CheckCircle2 } from "lucide-react";

export function EditorSidebarClient() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/editor/dashboard", icon: LayoutDashboard },
    { name: "New Submissions", href: "/editor/submissions/new", icon: FilePlus },
    { name: "Initial Screening", href: "/editor/submissions/screening", icon: Search },
    { name: "Reviewer Assignment", href: "/editor/submissions/assign-reviewers", icon: Users },
    { name: "Under Review", href: "/editor/submissions/under-review", icon: Eye },
    { name: "Completed Reviews", href: "/editor/submissions/completed-reviews", icon: CheckSquare },
    { name: "Editorial Decisions", href: "/editor/submissions/decisions", icon: BookOpen },
    { name: "Copyediting", href: "/editor/submissions/copyediting", icon: Edit },
    { name: "Final Approval", href: "/editor/submissions/final-approval", icon: CheckCircle2 },
    { name: "Revisions", href: "/editor/submissions/revisions", icon: Edit },
    { name: "Accepted / Rejected", href: "/editor/submissions/archive", icon: Archive },
  ];

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <item.icon className={`w-4.5 h-4.5 ${isActive ? "text-white" : "text-slate-400"}`} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </>
  );
}
