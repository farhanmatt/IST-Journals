export const dynamic = "force-dynamic";

import { MessageSquare, Mail, Sparkles, Inbox } from "lucide-react";
import Link from "next/link";

export default function AuthorMessagesPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Editorial Messages</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Direct communication threads between authors, editors, and reviewers.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 p-12 sm:p-16 text-center max-w-2xl mx-auto space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
          <MessageSquare className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">No Active Message Threads</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            Direct author-editor messaging is automatically activated whenever an editor assigns or discusses your manuscript. All formal decisions and revision instructions will also be delivered to your notifications.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/author/submissions"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
          >
            Check My Submissions
          </Link>
          <Link
            href="/author/notifications"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            View Notification Alerts
          </Link>
        </div>
      </div>
    </div>
  );
}
