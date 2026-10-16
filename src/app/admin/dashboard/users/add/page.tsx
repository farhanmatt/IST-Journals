"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "../actions";
import { ArrowLeft, Save, User, Mail, Lock, Shield } from "lucide-react";
import Link from "next/link";

const availableRoles = [
  { id: "ADMIN", label: "Administrator", desc: "Full system access" },
  { id: "JOURNAL_MANAGER", label: "Journal Manager", desc: "Manage journal settings and structure" },
  { id: "EDITOR", label: "Editor", desc: "Make editorial decisions on submissions" },
  { id: "SECTION_EDITOR", label: "Section Editor", desc: "Manage specific journal sections" },
  { id: "REVIEWER", label: "Reviewer", desc: "Conduct peer reviews" },
  { id: "COPYEDITOR", label: "Copyeditor", desc: "Edit accepted manuscripts" },
  { id: "PRODUCTION_EDITOR", label: "Production Editor", desc: "Prepare articles for publication" },
];

export default function AddUserPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Record<string, boolean>>({});

  const handleRoleToggle = (roleId: string) => {
    setRoles(prev => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    // Add roles to formData
    Object.keys(roles).forEach(key => {
      formData.append(`role_${key}`, roles[key] ? "true" : "false");
    });

    const result = await createUser(formData);

    if (result.success) {
      router.push("/admin/dashboard/users");
    } else {
      setError(result.error || "Failed to create user.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/admin/dashboard/users" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New User</h1>
          <p className="text-slate-500 mt-1">Create a new system user and assign roles.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-8">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <section>
              <h3 className="text-lg font-medium text-slate-900 mb-4 border-b border-slate-100 pb-2">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input type="text" name="name" required className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="John Doe" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input type="email" name="email" required className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="john@example.com" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Temporary Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input type="password" name="password" required className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="••••••••" />
                  </div>
                  <p className="text-xs text-slate-500">The user should change this after first login.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Account Status</label>
                  <select name="isActive" className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Roles */}
            <section>
              <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 pb-2">
                <Shield className="w-5 h-5 text-slate-700" />
                <h3 className="text-lg font-medium text-slate-900">Assign Roles</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableRoles.map((r) => (
                  <label 
                    key={r.id} 
                    className={`relative flex items-start p-4 cursor-pointer rounded-lg border-2 transition-colors ${
                      roles[r.id] ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        checked={!!roles[r.id]}
                        onChange={() => handleRoleToggle(r.id)}
                      />
                    </div>
                    <div className="ml-3 flex flex-col">
                      <span className={`block text-sm font-medium ${roles[r.id] ? 'text-blue-900' : 'text-slate-900'}`}>
                        {r.label}
                      </span>
                      <span className={`block text-xs mt-0.5 ${roles[r.id] ? 'text-blue-700' : 'text-slate-500'}`}>
                        {r.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
            <Link 
              href="/admin/dashboard/users"
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors bg-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Creating User..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
