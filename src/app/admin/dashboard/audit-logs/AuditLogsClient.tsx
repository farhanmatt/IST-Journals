"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, ShieldAlert, History, User } from "lucide-react";

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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-rose-500" />
            System Audit Logs
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review security events, user actions, and system changes.
          </p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-colors"
            placeholder="Search logs..."
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Timestamp</th>
              <th scope="col" className="px-6 py-4 font-semibold">User</th>
              <th scope="col" className="px-6 py-4 font-semibold">Action</th>
              <th scope="col" className="px-6 py-4 font-semibold w-1/3">Details</th>
              <th scope="col" className="px-6 py-4 font-semibold">Target (Submission)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-mono text-xs">
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                  </td>
                  <td className="px-6 py-4">
                    {log.user ? (
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1.5 text-slate-400" />
                        <span className="font-medium text-slate-900">{log.user.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">System</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="line-clamp-2" title={log.details || ""}>
                      {log.details || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.submission ? (
                      <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
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
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <History className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="font-medium text-slate-900">No logs found</p>
                    <p className="text-sm mt-1">Try adjusting your search query.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
