"use client";

import React, { useState } from "react";
import { updateRolePermissions } from "../actions";
import { Save, Check, X } from "lucide-react";

const SYSTEM_ROLES = [
  "ADMIN", "JOURNAL_MANAGER", "EDITOR", "SECTION_EDITOR", 
  "REVIEWER", "AUTHOR", "COPYEDITOR", "PRODUCTION_EDITOR"
];

const PERMISSION_CATEGORIES = [
  {
    name: "User Management",
    permissions: [
      { id: "VIEW_USERS", label: "View Users" },
      { id: "CREATE_USERS", label: "Create Users" },
      { id: "EDIT_USERS", label: "Edit Users" },
      { id: "DELETE_USERS", label: "Delete Users" },
      { id: "ASSIGN_ROLES", label: "Assign Roles" },
    ]
  },
  {
    name: "Submissions",
    permissions: [
      { id: "VIEW_SUBMISSIONS", label: "View Submissions" },
      { id: "ASSIGN_EDITOR", label: "Assign Editor" },
      { id: "ASSIGN_REVIEWER", label: "Assign Reviewer" },
      { id: "REQUEST_REVISION", label: "Request Revision" },
      { id: "ACCEPT_SUBMISSION", label: "Accept Submission" },
      { id: "REJECT_SUBMISSION", label: "Reject Submission" },
    ]
  },
  {
    name: "Publication",
    permissions: [
      { id: "CREATE_ISSUE", label: "Create Issue" },
      { id: "MANAGE_ARTICLES", label: "Manage Articles" },
      { id: "PUBLISH_ISSUE", label: "Publish Issue" },
    ]
  },
  {
    name: "Journal & Website",
    permissions: [
      { id: "MANAGE_JOURNAL", label: "Manage Journal" },
      { id: "MANAGE_SECTIONS", label: "Manage Sections" },
      { id: "MANAGE_EDITORIAL_TEAM", label: "Manage Editorial Team" },
      { id: "MANAGE_BRANDING", label: "Manage Branding" },
      { id: "MANAGE_PAGES", label: "Manage Pages" },
    ]
  }
];

export function RolesMatrix({ initialData }: { initialData: any[] }) {
  const [saving, setSaving] = useState<string | null>(null);
  
  // Create a mapping of [role][permission] = boolean
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>(() => {
    const initialState: Record<string, Record<string, boolean>> = {};
    SYSTEM_ROLES.forEach(role => {
      initialState[role] = {};
    });
    
    // Populate with existing DB data
    initialData.forEach(item => {
      if (initialState[item.role]) {
        initialState[item.role][item.permission] = true;
      }
    });
    
    // Auto-grant ALL to ADMIN by default if empty
    if (!initialData.some(i => i.role === 'ADMIN')) {
      PERMISSION_CATEGORIES.forEach(cat => {
        cat.permissions.forEach(p => {
          initialState["ADMIN"][p.id] = true;
        });
      });
    }

    return initialState;
  });

  const handleToggle = (role: string, permissionId: string) => {
    setMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permissionId]: !prev[role][permissionId]
      }
    }));
  };

  const handleSaveRole = async (role: string) => {
    setSaving(role);
    const rolePerms = Object.entries(matrix[role] || {})
      .filter(([_, isGranted]) => isGranted)
      .map(([perm]) => perm);

    await updateRolePermissions(role, rolePerms);
    setSaving(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-max">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 font-medium text-slate-700 w-64 border-r border-slate-200 shadow-sm sticky left-0 bg-slate-50 z-10">
              Permission
            </th>
            {SYSTEM_ROLES.map(role => (
              <th key={role} className="px-4 py-4 text-center font-medium text-slate-700 min-w-[140px]">
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-xs uppercase tracking-wider">{role.replace(/_/g, ' ')}</span>
                  <button
                    onClick={() => handleSaveRole(role)}
                    disabled={saving === role}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50"
                  >
                    {saving === role ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="w-3 h-3 mr-1" /> Save
                      </>
                    )}
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_CATEGORIES.map((category) => (
            <React.Fragment key={category.name}>
              {/* Category Header */}
              <tr className="bg-slate-100/50">
                <td 
                  colSpan={SYSTEM_ROLES.length + 1} 
                  className="px-6 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky left-0 z-10"
                >
                  {category.name}
                </td>
              </tr>
              {/* Permissions Rows */}
              {category.permissions.map((perm) => (
                <tr key={perm.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 text-sm text-slate-700 border-r border-slate-200 sticky left-0 bg-white z-10">
                    {perm.label}
                  </td>
                  {SYSTEM_ROLES.map(role => {
                    const isGranted = !!matrix[role]?.[perm.id];
                    return (
                      <td key={`${role}-${perm.id}`} className="px-4 py-3 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-slate-100">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isGranted}
                            onChange={() => handleToggle(role, perm.id)}
                            disabled={role === "ADMIN"} // Admin always has full access logically, but can be changed if strictly wanted
                          />
                          <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                            isGranted 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                          }`}>
                            {isGranted ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </div>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
