"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, Bell, Settings, LogOut, ExternalLink, Mail, ChevronDown, Menu, Shield } from "lucide-react";
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
      <header className="h-16 glass-header border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 shrink-0 shadow-xs transition-all">
        <div className="flex items-center space-x-3">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="md:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              title="Open menu"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Administration Portal
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors py-2 px-3 rounded-xl hover:bg-slate-100/80 border border-slate-200/60"
          >
            <span>Journal Home</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {/* Live Notifications Dropdown */}
          <NotificationDropdown />
          
          {/* Profile Section & Dropdown */}
          <div className="relative pl-1 sm:pl-2" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100/80 border border-transparent hover:border-slate-200/60 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 group text-left"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors max-w-[140px] truncate leading-tight">
                  {session?.user?.name || "Administrator"}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[140px]">
                  {session?.user?.email || "admin@system.local"}
                </p>
              </div>
              <div className="h-9 w-9 bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-white">
                <Shield className="w-4 h-4" />
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-dropdown border border-slate-200/90 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {session?.user?.name || "System Administrator"}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                    {session?.user?.email || "admin@system.local"}
                  </p>
                  <div className="mt-2.5">
                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase tracking-wider border border-blue-200/50">
                      ADMINISTRATOR
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/admin/dashboard/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>System Settings</span>
                  </Link>

                  <Link
                    href="/admin/dashboard/notifications/templates"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
                  >
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email Templates</span>
                  </Link>

                  <Link
                    href="/"
                    onClick={() => setIsDropdownOpen(false)}
                    className="sm:hidden flex items-center space-x-2.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <span>Journal Home</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowSignOutModal(true);
                    }}
                    className="flex w-full items-center space-x-2.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
