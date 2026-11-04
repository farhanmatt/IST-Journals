"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, ShieldAlert, History, User, Activity } from "lucide-react";

type AuditLogRecord = {
  id: string;
  action: string;
  details: string | null;
  createdAt: Date;
  user: { name: string; email: string } | null;
  submission: { submissionId: string; title: string } | null;
};

interface AuditLogsClientProps {
  logs: AuditLogRecord[];
}

export function AuditLogsClient({ logs }: AuditLogsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.user && log.user.name.toLowerCase().includes(q)) ||
      (log.submission && log.submission.submissionId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-rose-500" />
            System Audit Trail
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cryptographically logged events, editorial decisions, and user modifications.
          </p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs sm:text-sm bg-white shadow-2xs transition-all"
            placeholder="Search logs by action, user, or ID..."
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <th scope="col" className="px-6 py-4">Timestamp</th>
              <th scope="col" className="px-6 py-4">Actor</th>
              <th scope="col" className="px-6 py-4">Action</th>
              <th scope="col" className="px-6 py-4 w-1/3">Event Details</th>
              <th scope="col" className="px-6 py-4">Target Submission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-mono text-xs">
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.user ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mr-2 font-bold text-[10px]">
                          {log.user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">{log.user.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">System Automation</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="line-clamp-2 leading-relaxed" title={log.details || ""}>
                      {log.details || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.submission ? (
                      <span className="font-mono font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs">
                        {log.submission.submissionId}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No matching audit logs found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
