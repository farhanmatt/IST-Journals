"use client";

import { useState, useTransition } from "react";
import { updateWebsiteSettings } from "../actions";
import { Save, AlertCircle, CheckCircle2, Phone } from "lucide-react";

export function ContactClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateWebsiteSettings(formData);
      setStatus(result);
      if (result.success) setTimeout(() => setStatus(null), 3000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex items-center bg-slate-50/50">
        <Phone className="w-5 h-5 text-emerald-500 mr-2" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Contact Information</h2>
          <p className="text-sm text-slate-500">Update emails, addresses, and social links.</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {status && (
          <div className={`p-4 rounded-lg flex items-center space-x-3 text-sm font-medium ${status.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {status.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Support Email</label>
            <input
              type="email"
              name="supportEmail"
              defaultValue={initialSettings.supportEmail || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              placeholder="support@journal.com"
            />
          </div>
          
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Twitter/X URL</label>
            <input
              type="url"
              name="twitterUrl"
              defaultValue={initialSettings.twitterUrl || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              placeholder="https://twitter.com/yourjournal"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mailing Address</label>
            <textarea
              name="mailingAddress"
              defaultValue={initialSettings.mailingAddress || ""}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              placeholder="123 Publisher Street..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-70 shadow-sm"
          >
            {isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isPending ? "Saving..." : "Save Contact Info"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
