"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, Bell, Settings, LogOut, ExternalLink, Mail, ChevronDown, Menu } from "lucide-react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: AdminHeaderProps = {}) {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-[72px] bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0 shadow-sm transition-all">
        <div className="flex items-center space-x-3">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              title="Open menu"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="text-sm font-semibold text-slate-700 tracking-tight">
            Administration Portal
          </span>
        </div>
        
        <div className="flex items-center space-x-4 sm:space-x-6">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center space-x-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors py-1.5 px-2.5 rounded-md hover:bg-slate-100"
          >
            <span>Back to Site</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {/* Live Notifications Dropdown */}
          <NotificationDropdown />
          
          {/* Profile Section & Dropdown */}
          <div className="relative border-l border-slate-200 pl-4 sm:pl-6" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 cursor-pointer group text-left focus:outline-none"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                  {session?.user?.name || "System Administrator"}
                </p>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {session?.user?.email || "admin@system.local"}
                </p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm group-hover:shadow transition-all">
                <User className="w-4 h-4" />
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {session?.user?.name || "System Administrator"}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {session?.user?.email || "admin@system.local"}
                  </p>
                  <div className="mt-2">
                    <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">
                      ADMINISTRATOR
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/admin/dashboard/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>System Settings</span>
                  </Link>

                  <Link
                    href="/admin/dashboard/notifications/templates"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email Templates</span>
                  </Link>

                  <Link
                    href="/"
                    onClick={() => setIsDropdownOpen(false)}
                    className="sm:hidden flex items-center space-x-2.5 px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <span>Back to Site</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowSignOutModal(true);
                    }}
                    className="flex w-full items-center space-x-2.5 px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sign Out Modal */}
      <ConfirmDialog
        isOpen={showSignOutModal}
        title="Sign Out"
        message="Are you sure you want to sign out of the Admin Control Center? You will need to log back in to access administrative tools."
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
        icon={LogOut}
        onConfirm={() => signOut({ callbackUrl: "/admin" })}
        onCancel={() => setShowSignOutModal(false)}
      />
    </>
  );
}
