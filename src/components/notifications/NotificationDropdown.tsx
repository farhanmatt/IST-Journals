"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Users, 
  FileText, 
  Sparkles,
  Inbox
} from "lucide-react";
import { formatDateTime } from "@/lib/date";

export interface NotificationItem {
  id: string;
  userId: string;
  submissionId?: string | null;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string | Date;
  submission?: {
    id: string;
    submissionId: string;
    title: string;
    status: string;
  } | null;
}

interface NotificationDropdownProps {
  initialUnreadCount?: number;
  className?: string;
}

function getRelativeTime(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 45) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDateTime(date);
  } catch {
    return "";
  }
}

function getNotificationIcon(title: string, message: string) {
  const text = (title + " " + message).toLowerCase();
  if (text.includes("reject")) {
    return <XCircle className="w-4 h-4 text-red-600" />;
  }
  if (text.includes("accept") || text.includes("publish")) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  }
  if (text.includes("revision") || text.includes("correction")) {
    return <RotateCcw className="w-4 h-4 text-amber-600" />;
  }
  if (text.includes("invit") || text.includes("assign") || text.includes("review")) {
    return <Users className="w-4 h-4 text-indigo-600" />;
  }
  return <Bell className="w-4 h-4 text-blue-600" />;
}

function getNotificationDestination(notification: NotificationItem, roles: string[] = []): string | null {
  const subId = notification.submissionId || notification.submission?.id;
  if (!subId) return null;

  const text = (notification.title + " " + notification.message).toLowerCase();

  if (roles.includes("AUTHOR")) {
    if (text.includes("revision") || notification.submission?.status === "REVISION_REQUIRED") {
      return `/author/revisions?id=${subId}`;
    }
    if (text.includes("reject") || text.includes("decision") || notification.submission?.status === "REJECTED") {
      return `/author/decisions`;
    }
    return `/author/submissions`;
  }

  if (roles.includes("EDITOR") || roles.includes("ADMIN")) {
    return `/editor/submissions/${subId}`;
  }

  if (roles.includes("REVIEWER")) {
    if (text.includes("invitation")) {
      return `/reviewer/invitations`;
    }
    return `/reviewer/assigned/${subId}`;
  }

  if (roles.includes("COPYEDITOR")) {
    return `/copyeditor/assigned/${subId}`;
  }

  if (roles.includes("PRODUCTION_EDITOR")) {
    return `/production/assigned/${subId}`;
  }

  return null;
}

export function NotificationDropdown({
  initialUnreadCount = 0,
  className = ""
}: NotificationDropdownProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userRoles = (session?.user?.roles as string[]) || [];

  // Fetch notifications from server
  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!session?.user?.id) return;
    if (!isSilent) setLoading(true);

    try {
      const res = await fetch("/api/notifications", {
        headers: { "Cache-Control": "no-cache" }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [session?.user?.id]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Background live updates polling (every 25 seconds) and on tab focus
  useEffect(() => {
    if (!session?.user?.id) return;

    const interval = setInterval(() => {
      // Background poll silently without showing spinner
      fetchNotifications(true);
    }, 25000);

    const handleFocus = () => {
      fetchNotifications(true);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [session?.user?.id, fetchNotifications]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Mark a single notification as read/unread
  const handleToggleRead = async (notification: NotificationItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const newReadState = !notification.isRead;

    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, isRead: newReadState } : n))
    );
    setUnreadCount(prev => (newReadState ? Math.max(0, prev - 1) : prev + 1));

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification.id, isRead: newReadState })
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch (err) {
      console.warn("Failed to update notification read state:", err);
    }
  };

  // Mark a single notification as read when clicking it to view details
  const handleItemClick = (notification: NotificationItem) => {
    // If it was unread, mark it as read immediately
    if (!notification.isRead) {
      handleToggleRead(notification);
    }
    // Toggle expand/collapse of the card
    setExpandedId(prev => (prev === notification.id ? null : notification.id));
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true })
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch (err) {
      console.warn("Failed to mark all as read:", err);
    }
  };

  const displayedNotifications = notifications.filter(n => {
    if (activeTab === "unread") return !n.isRead;
    return true;
  });

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            // Re-fetch when user opens dropdown to ensure freshest list
            fetchNotifications(true);
          }
        }}
        className={`relative p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          isOpen
            ? "text-blue-600 bg-blue-50"
            : "text-slate-500 hover:text-blue-600 hover:bg-slate-100"
        }`}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5 transition-transform duration-200" />

        {/* Unread Count Number Badge - shown ONLY when unreadCount > 0 */}
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs ring-2 ring-white animate-in zoom-in-75 duration-150"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Professional Notification Dropdown Panel */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2.5 w-[calc(100vw-32px)] sm:w-[420px] max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="font-bold text-slate-900 text-base">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                  All caught up
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50/60 px-2 py-1 rounded-md transition-colors"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
                aria-label="Close notifications panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 px-5 bg-white">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "all"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
                activeTab === "unread"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Scrollable Notification Item List */}
          <div className="max-h-[380px] sm:max-h-[440px] overflow-y-auto divide-y divide-slate-100/90 scrollbar-thin scrollbar-thumb-slate-200">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-medium">Loading notifications...</p>
              </div>
            ) : displayedNotifications.length > 0 ? (
              displayedNotifications.map((notif) => {
                const destination = getNotificationDestination(notif, userRoles);
                const isExpanded = expandedId === notif.id;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`group relative p-4 transition-all cursor-pointer ${
                      !notif.isRead
                        ? "bg-blue-50/50 hover:bg-blue-50/80 border-l-4 border-blue-600"
                        : "bg-white hover:bg-slate-50/80 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Visual Status Indicator & Category Icon */}
                      <div className="relative mt-0.5 shrink-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs ${
                          !notif.isRead ? "bg-white ring-1 ring-blue-200" : "bg-slate-100 ring-1 ring-slate-200"
                        }`}>
                          {getNotificationIcon(notif.title, notif.message)}
                        </div>

                        {!notif.isRead && (
                          <span 
                            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white" 
                            title="Unread"
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className={`text-xs sm:text-sm leading-snug break-words ${
                            !notif.isRead
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-700"
                          }`}>
                            {notif.title}
                          </h4>

                          {/* Quick Toggle Read Button on Hover */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleRead(notif, e)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            title={notif.isRead ? "Mark as unread" : "Mark as read"}
                          >
                            <Check className={`w-3.5 h-3.5 ${notif.isRead ? "text-slate-300" : "text-blue-600"}`} />
                          </button>
                        </div>

                        {/* Message text */}
                        <p className={`text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}>
                          {notif.message}
                        </p>

                        {/* Metadata row: Submission Tag & Timestamp */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-1 text-[11px] text-slate-400">
                          {notif.submission?.submissionId && (
                            <span className="font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60">
                              {notif.submission.submissionId}
                            </span>
                          )}

                          <span 
                            className="flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            title={formatDateTime(notif.createdAt)}
                          >
                            <Clock className="w-3 h-3 mr-1 shrink-0" />
                            {getRelativeTime(notif.createdAt)}
                          </span>

                          {!notif.isRead && (
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider ml-auto">
                              New
                            </span>
                          )}
                        </div>

                        {/* Action Link (if applicable to manuscript) */}
                        {destination && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                            <Link
                              href={destination}
                              prefetch={true}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!notif.isRead) handleToggleRead(notif);
                                setIsOpen(false);
                              }}
                              className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <span>View Submission</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>

                            <span className="text-[10px] text-slate-400">
                              Click to view details
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-14 px-6 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {activeTab === "unread" ? "No unread notifications" : "No notifications yet"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    {activeTab === "unread" 
                      ? "You have reviewed all your alerts. New updates will appear here automatically." 
                      : "When you receive manuscript updates, reviews, or status changes, they will appear here."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time updates active</span>
            </span>

            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="font-medium text-blue-600 hover:text-blue-800 transition-colors text-xs"
              >
                Mark all as read
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">
                All caught up
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
