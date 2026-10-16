export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, FileText } from "lucide-react";

export default async function FinalApprovalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const submissions = await prisma.submission.findMany({
    where: { 
      status: { in: ["PENDING_FINAL_APPROVAL", "PRODUCTION_CORRECTIONS_REQUIRED"] } 
    },
    orderBy: { updatedAt: "desc" },
    include: { 
      author: { select: { name: true, email: true } },
      productionAssignments: {
        include: {
          productionEditor: { select: { name: true, email: true } }
        }
      },
      files: true
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          Final Publication Approval
        </h1>
        <p className="text-slate-500">
          Review galleys and publication metadata prepared by Production Editors, then approve to publish or request corrections.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Submission ID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Production Editor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Galleys</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {submissions.length > 0 ? (
                submissions.map((sub) => {
                  const productionEditor = sub.productionAssignments[0]?.productionEditor;
                  const hasPdf = sub.files.some(f => f.type === "PRODUCTION_READY_PDF");
                  const hasHtml = sub.files.some(f => f.type === "PRODUCTION_READY_HTML");

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-slate-700">
                        {sub.submissionId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 max-w-sm truncate" title={sub.title}>
                          {sub.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {sub.author?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {productionEditor?.name || productionEditor?.email || "Unassigned"}
                      </td>
                      <td className="px-6 py-4">
                        {sub.status === "PENDING_FINAL_APPROVAL" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Ready for Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Corrections Requested
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {hasPdf && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                              PDF
                            </span>
                          )}
                          {hasHtml && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                              HTML
                            </span>
                          )}
                          {!hasPdf && !hasHtml && (
                            <span className="text-xs text-slate-400 italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={'/editor/submissions/' + sub.id}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                        >
                          Review & Publish
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No manuscripts currently pending final publication approval.</p>
                      <p className="text-xs text-slate-400">
                        When Production Editors finish typesetting and click &quot;Submit to Editor for Final Approval&quot;, manuscripts will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
