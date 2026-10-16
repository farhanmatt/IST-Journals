"use client";

import { useState, useTransition } from "react";
import { updateJournalSettings } from "./actions";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateJournalSettings(formData);
      setStatus(result);
      
      // Clear success message after 3 seconds
      if (result.success) {
        setTimeout(() => setStatus(null), 3000);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">General Information</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure the public details and branding of your journal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {status && (
          <div className={`p-4 rounded-lg flex items-center space-x-3 text-sm font-medium ${status.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {status.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="journalName" className="block text-sm font-semibold text-slate-700 mb-1">
              Journal Name *
            </label>
            <input
              type="text"
              name="journalName"
              id="journalName"
              required
              defaultValue={initialSettings.journalName || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="e.g., IST Journals"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label htmlFor="issn" className="block text-sm font-semibold text-slate-700 mb-1">
              ISSN
            </label>
            <input
              type="text"
              name="issn"
              id="issn"
              defaultValue={initialSettings.issn || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="e.g., 1234-5678 (Online)"
            />
          </div>

          <div className="col-span-2">
            <label htmlFor="tagline" className="block text-sm font-semibold text-slate-700 mb-1">
              Tagline
            </label>
            <input
              type="text"
              name="tagline"
              id="tagline"
              defaultValue={initialSettings.tagline || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="A short, catchy slogan for the journal"
            />
          </div>

          <div className="col-span-2">
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1">
              Journal Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={4}
              defaultValue={initialSettings.description || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
              placeholder="Detailed description of the journal's scope and aims..."
            />
          </div>
        </div>

        <hr className="border-slate-200" />

        <h3 className="text-md font-bold text-slate-900">Contact & Publisher</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="publisher" className="block text-sm font-semibold text-slate-700 mb-1">
              Publisher Name
            </label>
            <input
              type="text"
              name="publisher"
              id="publisher"
              defaultValue={initialSettings.publisher || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="e.g., IST Journals"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
              Primary Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              defaultValue={initialSettings.email || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="contact@journal.org"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              id="phone"
              defaultValue={initialSettings.phone || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isPending ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
