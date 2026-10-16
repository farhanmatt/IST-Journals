"use client";

import { useState, useTransition } from "react";
import { updateSystemSettings } from "./actions";
import { Save, AlertCircle, CheckCircle2, Settings as SettingsIcon } from "lucide-react";

export function SettingsClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    
    // Checkboxes only send value if checked, so we need to manually append "false" if missing
    ['systemMaintenanceMode', 'allowRegistration', 'requireEmailVerification'].forEach(key => {
      if (!formData.has(key)) {
        formData.append(key, "false");
      }
    });

    startTransition(async () => {
      const result = await updateSystemSettings(formData);
      setStatus(result);
      if (result.success) setTimeout(() => setStatus(null), 3000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex items-center bg-slate-50/50">
        <SettingsIcon className="w-5 h-5 text-slate-500 mr-2" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">System Preferences</h2>
          <p className="text-sm text-slate-500">Manage technical configurations and global application behavior.</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {status && (
          <div className={`p-4 rounded-lg flex items-center space-x-3 text-sm font-medium ${status.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {status.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* General */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">General Environment</h3>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block">Maintenance Mode</label>
                <p className="text-xs text-slate-500 mt-1">Disables the public site and shows a maintenance screen.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="systemMaintenanceMode" value="true" defaultChecked={initialSettings.systemMaintenanceMode === "true"} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">System Timezone</label>
                <select
                  name="systemTimezone"
                  defaultValue={initialSettings.systemTimezone || "UTC"}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">User Registration</h3>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block">Allow Public Registration</label>
                <p className="text-xs text-slate-500 mt-1">Let authors and readers create their own accounts.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="allowRegistration" value="true" defaultChecked={initialSettings.allowRegistration !== "false"} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-slate-700 block">Require Email Verification</label>
                <p className="text-xs text-slate-500 mt-1">Users must verify their email before submitting manuscripts.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="requireEmailVerification" value="true" defaultChecked={initialSettings.requireEmailVerification === "true"} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Submissions */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">File Uploads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Max Upload Size (MB)</label>
                <input
                  type="number"
                  name="maxUploadSize"
                  min="1"
                  max="100"
                  defaultValue={initialSettings.maxUploadSize || "10"}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">Maximum allowed file size for manuscript PDF uploads.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-100">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-sm"
          >
            {isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isPending ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
