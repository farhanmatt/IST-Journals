import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export function SubmissionsTable({ 
  submissions, 
  emptyMessage = "No submissions found." 
}: { 
  submissions: any[], 
  emptyMessage?: string 
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Submission ID</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Author</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {submissions.length > 0 ? submissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-700">{sub.submissionId}</td>
                <td className="px-6 py-4 font-medium text-slate-900 max-w-md truncate" title={sub.title}>{sub.title}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                    sub.status === "REJECTED" || sub.status === "DESK_REJECTED"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : sub.status === "ACCEPTED" || sub.status === "PUBLISHED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : sub.status === "REVISION_REQUIRED"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : sub.status === "REVISION_SUBMITTED"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {sub.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{sub.author?.name || "Unknown"}</td>
                <td className="px-6 py-4 text-slate-500">
                  {sub.updatedAt.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/editor/submissions/${sub.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    View <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">{emptyMessage}</p>
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
