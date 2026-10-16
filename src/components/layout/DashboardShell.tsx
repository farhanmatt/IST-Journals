"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "./DashboardHeader";
import { X } from "lucide-react";

interface DashboardShellProps {
  sidebar: React.ReactNode;
  portalName: string;
  notificationsHref?: string;
  profileHref?: string;
  unreadCount?: number;
  hasUnread?: boolean;
  children: React.ReactNode;
  mainClassName?: string;
}

export function DashboardShell({
  sidebar,
  portalName,
  notificationsHref,
  profileHref,
  unreadCount = 0,
  hasUnread = false,
  children,
  mainClassName = "p-4 sm:p-6 lg:p-8",
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-blue-500/30">
      {/* Desktop Stationary Sidebar */}
      <aside className="hidden md:flex w-64 h-screen shrink-0 flex-col z-30 select-none">
        {sidebar}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebar}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Stationary Navbar */}
        <DashboardHeader
          portalName={portalName}
          notificationsHref={notificationsHref}
          profileHref={profileHref}
          unreadCount={unreadCount}
          hasUnread={hasUnread}
          onMenuToggle={() => setMobileMenuOpen(prev => !prev)}
        />

        {/* Scrollable Main Content */}
        <main className={`flex-1 overflow-y-auto ${mainClassName}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
