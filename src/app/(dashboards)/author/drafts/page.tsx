export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowRight, Plus, FileEdit } from "lucide-react";

export default async function DraftsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const submissions = await prisma.submission.findMany({
    where: { authorId: session.user.id, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Drafts</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Resume your unfinished manuscript submissions.</p>
        </div>
        <Link 
          href="/author/submit"
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Submission</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Submission ID</th>
                <th className="px-6 py-4">Manuscript Title</th>
                <th className="px-6 py-4">Progress Step</th>
                <th className="px-6 py-4">Last Saved</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {submissions.length > 0 ? submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-slate-700 text-xs whitespace-nowrap">{sub.submissionId}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{sub.title || "Untitled Draft"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                      Step {sub.currentStep} of 5
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                    {sub.updatedAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link 
                      href={`/author/submit`} 
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors border border-blue-200/60"
                    >
                      <span>Resume</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-200">
                        <FileEdit className="w-7 h-7 text-slate-400" />
                      </div>
                      <p className="text-slate-800 font-bold text-sm">No drafts found</p>
                      <p className="text-slate-500 text-xs max-w-sm leading-relaxed">
                        You have no incomplete drafts saved. Start a new submission whenever you&apos;re ready.
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
