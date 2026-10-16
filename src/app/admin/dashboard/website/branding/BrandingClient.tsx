"use client";

import { useState, useTransition } from "react";
import { updateWebsiteSettings } from "../actions";
import { Save, AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";

export function BrandingClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(initialSettings.logoUrl || "");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setStatus({ success: false, message: "Please select an image file." });
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setStatus({ success: false, message: "File size exceeds 5MB limit." });
        e.target.value = '';
        return;
      }
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      setStatus(null);
    }
  };

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
        <ImageIcon className="w-5 h-5 text-purple-500 mr-2" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Website Branding</h2>
          <p className="text-sm text-slate-500">Manage logos, colors, and visual identity.</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {status && (
          <div className={`p-4 rounded-lg flex items-center space-x-3 text-sm font-medium ${status.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {status.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Website Logo</label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0 relative flex items-center justify-center">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <input
                  type="file"
                  name="logoUrl"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-colors cursor-pointer"
                />
                <p className="text-xs text-slate-500 mt-2">Recommended: PNG/SVG up to 5MB.</p>
              </div>
            </div>
          </div>
          
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Favicon URL</label>
            <input
              type="url"
              name="faviconUrl"
              defaultValue={initialSettings.faviconUrl || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
              placeholder="https://example.com/favicon.ico"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Hero Image URL</label>
            <input
              type="url"
              name="heroImageUrl"
              defaultValue={initialSettings.heroImageUrl || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
              placeholder="https://example.com/hero-bg.jpg"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Primary Color (Hex)</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                name="primaryColor"
                defaultValue={initialSettings.primaryColor || "#4f46e5"}
                className="w-12 h-10 p-1 border border-slate-300 rounded cursor-pointer"
              />
              <span className="text-sm text-slate-500 font-mono">Select a brand color</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center space-x-2 px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-70 shadow-sm"
          >
            {isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isPending ? "Saving..." : "Save Branding"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
