export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export default async function MySubmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const submissions = await prisma.submission.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Submissions</h1>
          <p className="text-slate-500 mt-1 text-sm">Track the progress and review status of your submitted manuscripts.</p>
        </div>
        <Link 
          href="/author/submit"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm shadow-blue-500/20 whitespace-nowrap hover:-translate-y-0.5 active:translate-y-0"
        >
          Submit Manuscript
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Submission ID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {submissions.length > 0 ? submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-slate-700 text-xs">{sub.submissionId}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900 max-w-sm truncate" title={sub.title || "Untitled Draft"}>
                    {sub.title || "Untitled Draft"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      sub.status === "ACCEPTED" || sub.status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : sub.status === "REVISION_REQUIRED"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : sub.status === "REVISION_SUBMITTED"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : sub.status === "REJECTED" || sub.status === "DESK_REJECTED"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                    {sub.updatedAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {sub.status === "DRAFT" ? (
                      <Link href={`/author/submit`} className="text-blue-600 hover:text-blue-800 font-semibold text-xs sm:text-sm inline-flex items-center group">
                        <span>Resume</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : sub.status === "REVISION_REQUIRED" ? (
                      <Link href={`/author/revisions?id=${sub.id}`} className="text-amber-700 hover:text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/80 font-bold text-xs inline-flex items-center group transition-colors">
                        <span>Submit Revision</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : sub.status === "REVISION_SUBMITTED" ? (
                      <Link href={`/author/revisions`} className="text-blue-600 hover:text-blue-800 font-semibold text-xs sm:text-sm inline-flex items-center group">
                        <span>View Revision</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : sub.status === "REJECTED" || sub.status === "DESK_REJECTED" || sub.status === "ACCEPTED" ? (
                      <Link href={`/author/decisions`} className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs sm:text-sm inline-flex items-center group">
                        <span>View Decision</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <span className="text-slate-400 text-xs italic font-medium">In Review</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium text-sm">No submissions found</p>
                      <Link href="/author/submit" className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-semibold hover:underline">
                        Submit a manuscript &rarr;
                      </Link>
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
