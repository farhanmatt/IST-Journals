import Link from "next/link";
import { FileText, ArrowRight, Eye } from "lucide-react";

export function SubmissionsTable({ 
  submissions, 
  emptyMessage = "No submissions found." 
}: { 
  submissions: any[], 
  emptyMessage?: string 
}) {
  return (
    <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Submission ID</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Author</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {submissions.length > 0 ? submissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4 font-mono font-semibold text-slate-700 text-xs whitespace-nowrap">{sub.submissionId}</td>
                <td className="px-6 py-4 font-semibold text-slate-900 max-w-md truncate group-hover:text-blue-600 transition-colors" title={sub.title}>{sub.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${
                    sub.status === "REJECTED" || sub.status === "DESK_REJECTED"
                      ? "bg-rose-50 text-rose-700 border-rose-200/80"
                      : sub.status === "ACCEPTED" || sub.status === "PUBLISHED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                      : sub.status === "REVISION_REQUIRED"
                      ? "bg-amber-50 text-amber-800 border-amber-200/80"
                      : sub.status === "REVISION_SUBMITTED"
                      ? "bg-purple-50 text-purple-700 border-purple-200/80"
                      : "bg-blue-50 text-blue-700 border-blue-200/80"
                  }`}>
                    {sub.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium text-xs sm:text-sm whitespace-nowrap">{sub.author?.name || "Unknown"}</td>
                <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                  {sub.updatedAt.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <Link href={`/editor/submissions/${sub.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-bold text-xs sm:text-sm transition-colors py-1 px-2.5 rounded-lg hover:bg-blue-50">
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                      <FileText className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-slate-700 font-bold text-sm">{emptyMessage}</p>
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
