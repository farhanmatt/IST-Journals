"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Search, MoreVertical, Key, Eye, EyeOff, Shield, 
  CheckCircle2, XCircle, AlertCircle, X, Loader2, Lock, Mail 
} from "lucide-react";
import { formatDateTime } from "@/lib/date";
import { changeUserPassword } from "./actions";

export type UserItem = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string | Date;
  roles: { id: string; role: string }[];
};

interface UsersTableClientProps {
  users: UserItem[];
  selectedRole?: string;
}

export function UsersTableClient({ users, selectedRole }: UsersTableClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  // Modal State
  const [modalUser, setModalUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuUserId(null);
      }
    }
    if (activeMenuUserId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenuUserId]);

  // Close modal on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        if (modalUser) {
          closeModal();
        } else if (activeMenuUserId) {
          setActiveMenuUserId(null);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalUser, activeMenuUserId, isSubmitting]);

  // Client-side search filtering
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const openChangePasswordModal = (user: UserItem) => {
    setActiveMenuUserId(null);
    setModalUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSendEmail(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModalUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setSendEmail(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalUser) return;

    if (!newPassword) {
      setErrorMessage("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await changeUserPassword(modalUser.id, newPassword, sendEmail);
      if (res.success) {
        if (sendEmail) {
          if (res.emailSent) {
            setSuccessMessage(`Password updated! Credentials email sent to ${modalUser.email}.`);
            setTimeout(() => {
              closeModal();
            }, 2000);
          } else {
            setSuccessMessage(`Password updated in database!`);
            setErrorMessage(`Email notice: ${res.emailError || "Could not deliver email. Please configure GMAIL_USER and GMAIL_APP_PASSWORD in your .env file."}`);
            setTimeout(() => {
              closeModal();
            }, 4500);
          }
        } else {
          setSuccessMessage(`Password successfully updated for ${modalUser.name}!`);
          setTimeout(() => {
            closeModal();
          }, 1500);
        }
      } else {
        setErrorMessage(res.error || "Failed to update password.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="block w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm bg-white shadow-2xs transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { label: "All Users", role: undefined },
              { label: "Authors", role: "AUTHOR" },
              { label: "Reviewers", role: "REVIEWER" },
              { label: "Editors", role: "EDITOR" },
              { label: "Admins", role: "ADMIN" },
            ].map((tab) => {
              const isActive = (!selectedRole && !tab.role) || selectedRole === tab.role;
              const href = tab.role ? `/admin/dashboard/users?role=${tab.role}` : "/admin/dashboard/users";
              return (
                <Link
                  key={tab.label}
                  href={href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-500"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Roles</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Registered</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {searchQuery
                      ? `No users found matching "${searchQuery}".`
                      : `No users found${selectedRole ? ` with role ${selectedRole.replace(/_/g, " ")}` : ""}.`}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  // Rule: Check if user has Author role
                  const isAuthor = user.roles.some((ur) => ur.role === "AUTHOR");
                  const isMenuOpen = activeMenuUserId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3.5">
                          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">No roles</span>
                          ) : (
                            user.roles.map((ur) => (
                              <span
                                key={ur.id}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold tracking-wider uppercase border shadow-2xs ${
                                  ur.role === "ADMIN"
                                    ? "bg-red-50 text-red-700 border-red-200/80"
                                    : ur.role === "EDITOR"
                                    ? "bg-purple-50 text-purple-700 border-purple-200/80"
                                    : ur.role === "REVIEWER"
                                    ? "bg-amber-50 text-amber-800 border-amber-200/80"
                                    : "bg-slate-100 text-slate-700 border-slate-200/80"
                                }`}
                              >
                                {ur.role === "ADMIN" && <Shield className="w-3 h-3 mr-1" />}
                                {ur.role.replace(/_/g, " ")}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs sm:text-sm whitespace-nowrap">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        {/* Requirement: Display three-dot menu for every user except users with the Author role */}
                        {!isAuthor ? (
                          <div className="relative inline-block text-left" ref={isMenuOpen ? menuRef : null}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuUserId(isMenuOpen ? null : user.id)}
                              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${
                                isMenuOpen ? "bg-slate-100 text-slate-900" : ""
                              }`}
                              title="User Actions"
                              aria-label="User Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white shadow-xl border border-slate-200/90 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                <button
                                  type="button"
                                  onClick={() => openChangePasswordModal(user)}
                                  className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                                >
                                  <Key className="w-4 h-4 mr-2.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                  <span>Change Password</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Empty for Author users as per requirement */
                          <span className="text-slate-300 select-none text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Count footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-700">{filteredUsers.length > 0 ? 1 : 0}</span> to{" "}
            <span className="font-bold text-slate-700">{filteredUsers.length}</span> of{" "}
            <span className="font-bold text-slate-700">{users.length}</span> users
          </p>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 bg-white disabled:opacity-40" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 bg-white disabled:opacity-40" disabled>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {modalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
          >
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="change-password-title" className="text-lg font-black text-slate-900 tracking-tight">
                    Change Password
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Update credentials for this system user
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target User Info Banner */}
            <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center space-x-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0">
                {modalUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{modalUser.name}</p>
                <p className="text-[11px] text-slate-500 font-medium truncate">{modalUser.email}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitPassword} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start space-x-2.5 text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* New Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    disabled={isSubmitting}
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm bg-white shadow-2xs transition-all disabled:opacity-60"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    disabled={isSubmitting}
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm bg-white shadow-2xs transition-all disabled:opacity-60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Match Status Helper */}
              {newPassword && confirmPassword && (
                <div className="text-[11px] font-semibold">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}

              {/* Send Credentials to User's Gmail Option */}
              <div className="pt-1">
                <label className="flex items-start gap-3 p-3 bg-blue-50/70 hover:bg-blue-50 border border-blue-100 rounded-2xl cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    disabled={isSubmitting}
                    className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      Send new password to user&apos;s Gmail
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                      Deliver new credentials directly to <span className="font-semibold text-slate-700">{modalUser.email}</span> via Gmail SMTP.
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition-all shadow-glow flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>{sendEmail ? "Updating & Sending Email..." : "Updating..."}</span>
                    </>
                  ) : (
                    <span>{sendEmail ? "Update & Send to Gmail" : "Update Password"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
