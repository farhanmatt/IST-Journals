"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { 
  Bell, 
  User, 
  LogOut, 
  ChevronDown, 
  ExternalLink,
  Menu
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

interface DashboardHeaderProps {
  portalName: string;
  notificationsHref?: string;
  profileHref?: string;
  unreadCount?: number;
  hasUnread?: boolean;
  onMenuToggle?: () => void;
}

export function DashboardHeader({
  portalName,
  notificationsHref,
  profileHref,
  unreadCount = 0,
  hasUnread = false,
  onMenuToggle,
}: DashboardHeaderProps) {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Close dropdown on outside click
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
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-20 shadow-xs transition-all">
        {/* Left: Portal Title / Mobile Menu Button */}
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
          <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {portalName}
          </span>
        </div>

        {/* Right: Actions (Notifications, Back to Site, Profile) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            href="/"
            prefetch={true}
            className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors py-2 px-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/60"
          >
            <span>Back to Site</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {/* Notifications Dropdown Panel */}
          <NotificationDropdown initialUnreadCount={unreadCount} />

          {/* Profile Section & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 group"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-sm shadow-blue-500/20 ring-2 ring-white">
                {initial}
              </div>
              
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors max-w-[120px] truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate max-w-[120px]">
                  {user?.roles?.[0]?.replace(/_/g, " ") || "Member"}
                </p>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900 truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">{user?.email || ""}</p>
                  {user?.roles && user.roles.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {user.roles.map((r: string) => (
                        <span key={r} className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase tracking-wider border border-blue-200/50">
                          {r.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="py-1">
                  {profileHref && (
                    <Link
                      href={profileHref}
                      prefetch={true}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>My Profile</span>
                    </Link>
                  )}

                  {notificationsHref && (
                    <Link
                      href={notificationsHref}
                      prefetch={true}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
                    >
                      <Bell className="w-4 h-4 text-slate-400" />
                      <span>Notifications</span>
                    </Link>
                  )}

                  <Link
                    href="/"
                    prefetch={true}
                    onClick={() => setIsDropdownOpen(false)}
                    className="sm:hidden flex items-center space-x-2.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
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
        message="Are you sure you want to sign out of your account? You will need to log back in to access your dashboard."
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
        icon={LogOut}
        onConfirm={() => signOut({ callbackUrl: "/login" })}
        onCancel={() => setShowSignOutModal(false)}
      />
    </>
  );
}
