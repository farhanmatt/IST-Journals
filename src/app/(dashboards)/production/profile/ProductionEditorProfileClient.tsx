"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  KeyRound, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Save, 
  FileText 
} from "lucide-react";
import { updateProductionProfile } from "./actions";

interface ProductionEditorProfileClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    roles: string[];
  };
  stats: {
    assignedCount: number;
    completedCount: number;
  };
}

export function ProductionEditorProfileClient({ user, stats }: ProductionEditorProfileClientProps) {
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Full Name is required.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Email address is required.");
      return;
    }

    if (showPasswordFields && newPassword) {
      if (!currentPassword) {
        setErrorMessage("Please enter your current password to set a new password.");
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage("New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("New password and confirmation do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await updateProductionProfile({
        name,
        email,
        currentPassword: showPasswordFields ? currentPassword : undefined,
        newPassword: showPasswordFields ? newPassword : undefined,
        confirmPassword: showPasswordFields ? confirmPassword : undefined,
      });

      if (response.success) {
        setSuccessMessage(response.message || "Profile updated successfully!");
        if (response.user) {
          setName(response.user.name);
          setEmail(response.user.email);
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordFields(false);
        router.refresh();
      } else {
        setErrorMessage(response.error || "Failed to update profile.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Production Editor Profile</h1>
        <p className="text-slate-500 text-sm">View and update your profile details and credentials.</p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center space-x-5">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-inner">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{name}</h2>
                <p className="text-slate-500 text-sm mt-0.5">{email}</p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {user.roles.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase rounded-full border border-indigo-100"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      <span>{r.replace(/_/g, " ")}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-100">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Member since {user.createdAt}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Assigned Production Tasks</p>
                <p className="text-lg font-bold text-slate-900">{stats.assignedCount}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Completed Publications</p>
                <p className="text-lg font-bold text-slate-900">{stats.completedCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-lg font-bold text-slate-900">Edit Profile Details</h3>
            <p className="text-sm text-slate-500">Update your name, email address, or account password.</p>
          </div>

          {/* Feedback Alerts */}
          {successMessage && (
            <div className="mb-6 flex items-center p-4 text-sm text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle className="w-5 h-5 mr-2.5 flex-shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 flex items-center p-4 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-5 h-5 mr-2.5 flex-shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="production@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-800">Security & Password</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordFields(!showPasswordFields);
                    if (showPasswordFields) {
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {showPasswordFields ? "Cancel Password Change" : "Change Password"}
                </button>
              </div>

              {showPasswordFields && (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 block">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 block">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
