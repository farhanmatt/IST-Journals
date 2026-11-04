"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BookOpen, Menu, X, ChevronRight, LayoutDashboard, ArrowRight } from "lucide-react";
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
    <header className="sticky top-0 z-50 glass-header border-b border-slate-200/80 shadow-card transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18 gap-3">
          
          {/* Logo & Journal Title */}
          <div className="flex-shrink-0 flex items-center min-w-0">
            <Link href="/#home" className="flex items-center space-x-2.5 group min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 ring-2 ring-white/80 group-hover:scale-105 transition-all shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-[220px] xl:max-w-[280px]">
                  {journalName}
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase -mt-0.5 hidden sm:block">
                  Open Access Journal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0">
            {navLinks.map((link) => {
              const isActive = link.isRoute && pathname === link.href;

              return (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`text-xs xl:text-[13px] font-semibold px-2.5 xl:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    isActive 
                      ? "text-blue-600 bg-blue-50/90 font-bold shadow-2xs" 
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-100/70"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth / Actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0 ml-1">
            <div className="h-5 w-px bg-slate-200/80 mx-1 shrink-0" />
            
            {session ? (
              <Link 
                prefetch={true}
                href={dashboardUrl}
                className="inline-flex items-center gap-1.5 text-xs xl:text-[13px] font-semibold px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/login" 
                  prefetch={true} 
                  className="text-xs xl:text-[13px] font-semibold text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-100/70 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  prefetch={true} 
                  className="inline-flex items-center gap-1 text-xs xl:text-[13px] font-semibold bg-blue-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
                >
                  <span>Register</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
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
        <div className="lg:hidden bg-white/98 backdrop-blur-md border-b border-slate-200/90 shadow-dropdown absolute top-full left-0 w-full animate-in fade-in slide-in-from-top-2 duration-150">
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
                      ? "text-blue-600 bg-blue-50/80 font-bold" 
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
                  className="flex items-center justify-center gap-1.5 w-full text-center text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 rounded-xl shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Open Dashboard</span>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
                  >
                    Sign In
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
