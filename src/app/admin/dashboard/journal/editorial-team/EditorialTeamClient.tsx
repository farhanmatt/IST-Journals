"use client";

import { useState, useTransition, useEffect } from "react";
import { getEditorialTeam, searchUsersForTeam, addEditorialRole, removeEditorialRole } from "./actions";
import { Users, Search, Plus, Trash2, UserPlus, Shield, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Role } from "@/generated/client";
import { useConfirm } from "@/components/ui/ConfirmDialog";

type TeamMember = {
  id: string;
  userId: string;
  role: Role;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type SearchResult = {
  id: string;
  name: string;
  email: string;
};

interface EditorialTeamClientProps {
  initialTeam: TeamMember[];
}

export function EditorialTeamClient({ initialTeam }: EditorialTeamClientProps) {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const confirm = useConfirm();
  
  // Add Member Modal State
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("EDITOR");

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delay = setTimeout(async () => {
        const results = await searchUsersForTeam(searchQuery);
        setSearchResults(results);
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleRemoveRole = async (userId: string, role: Role) => {
    const member = team.find(m => m.userId === userId && m.role === role);
    const roleName = role.replace(/_/g, ' ');
    const confirmed = await confirm({
      title: "Remove Editorial Role",
      message: (
        <div className="space-y-2">
          <p>
            Are you sure you want to remove the <span className="font-semibold text-slate-900">{roleName}</span> role from <span className="font-semibold text-slate-900">{member?.user.name || "this user"}</span>?
          </p>
          <p className="text-xs text-red-600 font-medium">This user will lose access to permissions associated with this role.</p>
        </div>
      ),
      confirmText: "Remove Role",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;

    setStatus(null);
    startTransition(async () => {
      const result = await removeEditorialRole(userId, role);
      if (result.success) {
        const updatedTeam = await getEditorialTeam();
        setTeam(updatedTeam);
      }
      setStatus(result);
      setTimeout(() => setStatus(null), 3000);
    });
  };

  const handleAddRole = () => {
    if (!selectedUser || !selectedRole) return;

    setStatus(null);
    startTransition(async () => {
      const result = await addEditorialRole(selectedUser.id, selectedRole);
      if (result.success) {
        const updatedTeam = await getEditorialTeam();
        setTeam(updatedTeam);
        setIsAdding(false);
        setSearchQuery("");
        setSelectedUser(null);
      }
      setStatus(result);
      setTimeout(() => setStatus(null), 3000);
    });
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50/50">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-lg font-bold text-slate-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-emerald-500" />
            Editorial Board Members
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage roles for Journal Managers, Editors, and Section Editors.
          </p>
        </div>
        <button
          onClick={() => { setIsAdding(!isAdding); setSelectedUser(null); setSearchQuery(""); }}
          disabled={isPending}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          {isAdding ? <XIcon /> : <UserPlus className="w-4 h-4" />}
          <span>{isAdding ? "Cancel" : "Add to Team"}</span>
        </button>
      </div>

      <div className="p-6">
        {status && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 text-sm font-medium ${status.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {status.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{status.message}</span>
          </div>
        )}

        {/* Add Member Panel */}
        {isAdding && (
          <div className="mb-8 p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Assign Editorial Role</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Search User</label>
                {!selectedUser ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      placeholder="Search by name or email..."
                    />
                    {searchResults.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {searchResults.map((user) => (
                          <li
                            key={user.id}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-emerald-50"
                            onClick={() => setSelectedUser(user)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">{user.name}</span>
                              <span className="text-slate-500 text-xs">{user.email}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border border-emerald-200 bg-white rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{selectedUser.name}</span>
                      <span className="text-slate-500 text-sm">{selectedUser.email}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedUser(null)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <XIcon />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Role</label>
                <div className="flex space-x-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as Role)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                  >
                    <option value="JOURNAL_MANAGER">Journal Manager</option>
                    <option value="EDITOR">Editor</option>
                    <option value="SECTION_EDITOR">Section Editor</option>
                  </select>
                  <button
                    onClick={handleAddRole}
                    disabled={!selectedUser || isPending}
                    className="flex-shrink-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    Assign Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member) => (
            <div key={member.id} className="border border-slate-200 rounded-xl p-5 hover:border-emerald-200 hover:shadow-sm transition-all bg-white relative group">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <span className="text-slate-600 font-bold text-lg">
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{member.user.name}</h3>
                    <div className="flex items-center text-xs text-slate-500 mt-0.5">
                      <Mail className="w-3 h-3 mr-1" />
                      {member.user.email}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Shield className="w-3 h-3 mr-1.5" />
                  {formatRole(member.role)}
                </div>
                
                <button
                  onClick={() => handleRemoveRole(member.userId, member.role)}
                  disabled={isPending}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Remove Role"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {team.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No editorial team members found.</p>
              <p className="text-sm text-slate-400 mt-1">Assign roles to users to build your editorial board.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
