"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900 shadow-xs shrink-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      title="Go back"
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}
