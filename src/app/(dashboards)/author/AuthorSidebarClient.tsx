"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, FileSignature, 
  FileText, History, GitPullRequest, Globe, 
  BookOpen, MessageSquare 
} from "lucide-react";

export function AuthorSidebarClient() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/author/dashboard", icon: LayoutDashboard },
    { name: "Submit Manuscript", href: "/author/submit", icon: FileSignature },
    { name: "My Submissions", href: "/author/submissions", icon: FileText },
    { name: "Drafts", href: "/author/drafts", icon: History },
    { name: "Revisions", href: "/author/revisions", icon: GitPullRequest },
    { name: "Editorial Decisions", href: "/author/decisions", icon: BookOpen },
    { name: "Published Articles", href: "/author/published", icon: Globe },
    { name: "Messages", href: "/author/messages", icon: MessageSquare },
  ];

  return (
    <nav className="space-y-1">
      {menuItems.map((item) => {
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
            <item.icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-400"}`} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
