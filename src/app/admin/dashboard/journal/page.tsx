import { Construction } from "lucide-react";
import Link from "next/link";
import { Settings, Layers, Users } from "lucide-react";

export default function JournalPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col min-h-[500px]">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Journal Management</h1>
      <p className="text-slate-500 mb-8">
        Manage your journal's configuration, structure, and editorial board here. 
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/dashboard/journal/settings" className="border border-slate-200 rounded-lg p-6 hover:shadow-md hover:border-blue-300 transition-all group">
          <Settings className="w-8 h-8 text-blue-500 mb-4 group-hover:text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Journal Settings</h2>
          <p className="text-sm text-slate-500">Configure global settings, policies, and general journal information.</p>
        </Link>
        
        <Link href="/admin/dashboard/journal/sections" className="border border-slate-200 rounded-lg p-6 hover:shadow-md hover:border-blue-300 transition-all group">
          <Layers className="w-8 h-8 text-indigo-500 mb-4 group-hover:text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Sections</h2>
          <p className="text-sm text-slate-500">Manage manuscript sections, categories, and their specific review requirements.</p>
        </Link>

        <Link href="/admin/dashboard/journal/editorial-team" className="border border-slate-200 rounded-lg p-6 hover:shadow-md hover:border-blue-300 transition-all group">
          <Users className="w-8 h-8 text-emerald-500 mb-4 group-hover:text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Editorial Team</h2>
          <p className="text-sm text-slate-500">Configure the editorial board and manage editor assignments and roles.</p>
        </Link>
      </div>
    </div>
  );
}
