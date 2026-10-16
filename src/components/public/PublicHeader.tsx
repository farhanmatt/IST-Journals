"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BookOpen, Menu, X, ChevronRight, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

interface PublicHeaderProps {
  journalName: string;
}

export function PublicHeader({ journalName }: PublicHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  // Close mobile menu on resize to desktop or on Escape key
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navLinks = [
    { name: "Home", href: "/#home" },
    { name: "About", href: "/#about" },
    { name: "Current Issue", href: "/#current-issue" },
    { name: "Archives", href: "/#archives" },
    { name: "Articles", href: "/articles", isRoute: true },
    { name: "Editorial Team", href: "/#editorial-team" },
    { name: "Author Guidelines", href: "/#guidelines" },
    { name: "Contact", href: "/#contact" },
  ];

  const dashboardUrl = session?.user?.roles?.includes("ADMIN") ? "/admin/dashboard" :
    session?.user?.roles?.includes("EDITOR") ? "/editor/dashboard" :
    session?.user?.roles?.includes("COPYEDITOR") ? "/copyeditor/dashboard" :
    session?.user?.roles?.includes("PRODUCTION_EDITOR") ? "/production/dashboard" :
    session?.user?.roles?.includes("REVIEWER") ? "/reviewer/dashboard" :
    session?.user?.roles?.includes("AUTHOR") ? "/author/dashboard" :
    `/${session?.user?.roles?.[0]?.toLowerCase()?.replace('_', '-')}/dashboard`;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18 gap-2 xl:gap-4">
          
          {/* Logo & Journal Title */}
          <div className="flex-shrink-0 flex items-center min-w-0 mr-1 xl:mr-3">
            <Link href="/#home" className="flex items-center space-x-2.5 group min-w-0">
              <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <span className="font-bold text-sm xl:text-[15px] 2xl:text-base text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate max-w-[180px] sm:max-w-xs lg:max-w-[210px] xl:max-w-[260px] 2xl:max-w-none">
                {journalName}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 2xl:gap-1.5 shrink-0">
            {navLinks.map((link) => {
              const isActive = link.isRoute && pathname === link.href;

              return (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`text-xs xl:text-[12.5px] 2xl:text-sm font-semibold px-2 xl:px-2.5 2xl:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    isActive 
                      ? "text-blue-600 bg-blue-50/80 font-bold" 
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth / Actions */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0 ml-1 xl:ml-2">
            <div className="h-4.5 w-px bg-slate-200 mx-0.5 shrink-0" />
            
            {session ? (
              <Link 
                prefetch={true}
                href={dashboardUrl}
                className="inline-flex items-center gap-1.5 text-xs xl:text-[13px] font-semibold px-3 xl:px-3.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  prefetch={true} 
                  className="text-xs xl:text-[13px] font-semibold text-slate-700 hover:text-blue-600 px-2.5 xl:px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  prefetch={true} 
                  className="text-xs xl:text-[13px] font-semibold bg-blue-600 text-white px-3 xl:px-3.5 py-1.5 rounded-lg hover:bg-blue-700 shadow-xs shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="block h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="block h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay / Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-md border-b border-slate-200/90 shadow-xl absolute top-full left-0 w-full animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 pt-3 pb-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = link.isRoute && pathname === link.href;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive 
                      ? "text-blue-600 bg-blue-50/80" 
                      : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{link.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              );
            })}
          </div>

          <div className="pt-3 pb-4 border-t border-slate-100">
            <div className="px-4">
              {session ? (
                <Link 
                  href={dashboardUrl}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full text-center text-sm font-semibold text-white bg-blue-600 px-4 py-2.5 rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center text-sm font-semibold text-white bg-blue-600 px-4 py-2.5 rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
