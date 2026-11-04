"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Book, FileText, 
  UploadCloud, Globe, Bell, BarChart, 
  ShieldAlert, Settings, ChevronDown, ChevronRight, Shield
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  title: string;
  icon: React.ElementType;
  href?: string;
  subItems?: { title: string; href: string }[];
};

const navItems: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  {
    title: "Users",
    icon: Users,
    subItems: [
      { title: "All Users", href: "/admin/dashboard/users" },
      { title: "Add User", href: "/admin/dashboard/users/add" },
      { title: "Roles & Permissions", href: "/admin/dashboard/users/roles" },
    ],
  },
  {
    title: "Journal",
    icon: Book,
    href: "/admin/dashboard/journal",
    subItems: [
      { title: "Journal Settings", href: "/admin/dashboard/journal/settings" },
      { title: "Sections", href: "/admin/dashboard/journal/sections" },
      { title: "Editorial Team", href: "/admin/dashboard/journal/editorial-team" },
    ],
  },
  {
    title: "Submissions",
    icon: FileText,
    subItems: [
      { title: "All Submissions", href: "/admin/dashboard/submissions" },
      { title: "Under Review", href: "/admin/dashboard/submissions/under-review" },
      { title: "Revisions", href: "/admin/dashboard/submissions/revisions" },
      { title: "Accepted", href: "/admin/dashboard/submissions/accepted" },
      { title: "Rejected", href: "/admin/dashboard/submissions/rejected" },
    ],
  },
  {
    title: "Publication",
    icon: UploadCloud,
    subItems: [
      { title: "Issues", href: "/admin/dashboard/publication/issues" },
      { title: "Articles", href: "/admin/dashboard/publication/articles" },
      { title: "Published", href: "/admin/dashboard/publication/published" },
    ],
  },
  {
    title: "Website",
    icon: Globe,
    subItems: [
      { title: "Branding", href: "/admin/dashboard/website/branding" },
      { title: "Pages", href: "/admin/dashboard/website/pages" },
      { title: "Contact", href: "/admin/dashboard/website/contact" },
    ],
  },
  {
    title: "Reports",
    icon: BarChart,
    subItems: [
      { title: "Analytics", href: "/admin/dashboard/reports/analytics" },
    ],
  },
  { title: "Audit Logs", icon: ShieldAlert, href: "/admin/dashboard/audit-logs" },
  { title: "Settings", icon: Settings, href: "/admin/dashboard/settings" },
];

export function Sidebar({ isMobile = false, onClose }: { isMobile?: boolean; onClose?: () => void } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className={`w-64 bg-slate-950 text-slate-300 h-full flex flex-col flex-shrink-0 transition-all duration-300 shadow-2xl z-20 border-r border-slate-800/80 ${isMobile ? 'flex' : 'hidden md:flex'}`}>
      <div className="h-16 px-6 flex items-center border-b border-slate-800/80 bg-slate-950/80 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/25 ring-1 ring-white/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white tracking-[0.18em] uppercase">
              Admin Portal
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
              Management Suite
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === pathname || item.subItems?.some(sub => pathname.startsWith(sub.href));
            const isOpen = openMenus[item.title] || isActive;

            return (
              <li key={item.title} className="flex flex-col">
                {item.href && !item.subItems ? (
                  <Link 
                    href={item.href}
                    prefetch={true}
                    onClick={() => { if (isMobile && onClose) onClose(); }}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold ${
                      pathname === item.href 
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20" 
                        : "hover:bg-slate-800/70 hover:text-white text-slate-400"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${pathname === item.href ? "text-white" : "text-slate-400"}`} />
                    <span>{item.title}</span>
                  </Link>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        toggleMenu(item.title);
                        if (item.href) router.push(item.href);
                      }}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 w-full text-xs sm:text-sm font-semibold ${
                        isActive 
                          ? "bg-slate-800/80 text-white" 
                          : "hover:bg-slate-800/60 hover:text-white text-slate-400"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                        <span>{item.title}</span>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                      <ul className="space-y-1 pl-10 pr-1 mb-2 border-l border-slate-800/80 ml-5">
                        {item.subItems?.map((subItem) => (
                          <li key={subItem.title}>
                            <Link 
                              href={subItem.href}
                              prefetch={true}
                              onClick={() => { if (isMobile && onClose) onClose(); }}
                              className={`block px-3 py-1.5 text-xs rounded-lg transition-all duration-200 font-medium ${
                                pathname === subItem.href 
                                  ? "text-blue-400 font-semibold bg-blue-500/10" 
                                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                              }`}
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
