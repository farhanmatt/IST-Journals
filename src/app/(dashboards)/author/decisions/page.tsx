export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  BookOpen, CheckCircle2, XCircle, AlertCircle, 
  Globe, ArrowRight, FileText, Calendar, User 
} from "lucide-react";

export default async function AuthorDecisionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const submissions = await prisma.submission.findMany({
    where: {
      authorId: session.user.id,
      OR: [
        { decisions: { some: {} } },
        { status: { in: ["ACCEPTED", "REJECTED", "DESK_REJECTED", "REVISION_REQUIRED", "PUBLISHED"] } }
      ]
    },
    include: {
      section: true,
      decisions: {
        include: {
          editor: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      publishedArticle: {
        select: { id: true, doi: true }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Editorial Decisions</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Official editorial decisions and feedback for your manuscripts.</p>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Decisions Yet</h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Editorial decisions will appear here once the editors review your submitted manuscripts and record a verdict.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((sub) => {
            const latestDecision = sub.decisions[0];
            const isAccepted = sub.status === "ACCEPTED" || sub.status === "PUBLISHED";
            const isRejected = sub.status === "REJECTED" || sub.status === "DESK_REJECTED";
            const isRevisionRequired = sub.status === "REVISION_REQUIRED";

            return (
              <div 
                key={sub.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden"
              >
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isAccepted 
                          ? "bg-emerald-100 text-emerald-800"
                          : isRejected 
                          ? "bg-red-100 text-red-800"
                          : isRevisionRequired 
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {sub.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-500">ID: {sub.submissionId}</span>
                      <span className="text-xs text-slate-400">• Submitted {new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{sub.title || "Untitled Manuscript"}</h2>
                    <p className="text-xs text-slate-500">Section: {sub.section?.name || "General"}</p>
                  </div>

                  {/* Quick Action */}
                  <div className="shrink-0">
                    {(sub.status === "REJECTED" || sub.status === "DESK_REJECTED") && (
                      <Link
                        href="/author/submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
                      >
                        <span>Submit New Manuscript</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    {isRevisionRequired && (
                      <Link
                        href={`/author/revisions?id=${sub.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-amber-600/20 transition-colors"
                      >
                        <span>Submit Revision</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    {sub.publishedArticle && (
                      <Link
                        href={`/article/${sub.publishedArticle.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>View Published Article</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Decisions Timeline / History */}
                <div className="p-5 sm:p-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Decision Details & Editorial Instructions
                  </h3>

                  {sub.decisions.length > 0 ? (
                    <div className="space-y-4">
                      {sub.decisions.map((dec) => {
                        const isDecAccept = dec.decision === "ACCEPT";
                        const isDecReject = dec.decision === "REJECT" || dec.decision === "DESK_REJECT";
                        const isDecMinor = dec.decision === "MINOR_REVISION";
                        const isDecMajor = dec.decision === "MAJOR_REVISION";

                        return (
                          <div 
                            key={dec.id} 
                            className={`p-5 rounded-2xl border space-y-3 ${
                              isDecAccept 
                                ? "bg-emerald-50/50 border-emerald-200/80" 
                                : isDecReject 
                                ? "bg-red-50/50 border-red-200/80" 
                                : isDecMajor 
                                ? "bg-orange-50/50 border-orange-200/80" 
                                : "bg-amber-50/50 border-amber-200/80"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                              <div className="flex items-center gap-2">
                                {isDecAccept && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                                {isDecReject && <XCircle className="w-5 h-5 text-red-600" />}
                                {(isDecMinor || isDecMajor) && <AlertCircle className="w-5 h-5 text-amber-600" />}
                                <span className="font-bold text-slate-900 text-sm">
                                  {dec.decision.replace(/_/g, ' ')}
                                </span>
                                {dec.editor?.name && (
                                  <span className="text-xs text-slate-500">• Handling Editor: {dec.editor.name}</span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 font-medium">
                                {new Date(dec.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Author-facing comments */}
                            {dec.commentsForAuthor ? (
                              <div>
                                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                                  Editor Comments:
                                </h4>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                                  {dec.commentsForAuthor}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic">No additional written comments accompanied this decision.</p>
                            )}

                            {/* Status context notice */}
                            {isDecReject && (
                              <div className="pt-2 border-t border-red-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-xs text-red-700 font-medium leading-relaxed">
                                  Notice: This manuscript has been rejected and cannot be modified or re-uploaded. To submit this paper again, please create a new submission.
                                </p>
                                <Link
                                  href="/author/submit"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-red-600/20 transition-colors shrink-0"
                                >
                                  <span>Submit As New Manuscript</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            )}
                            {isDecAccept && (
                              <p className="text-xs text-emerald-700 font-medium">
                                Congratulations! Your manuscript will proceed through copyediting and production typesetting.
                              </p>
                            )}
                            {(isDecMinor || isDecMajor) && sub.status === "REVISION_REQUIRED" && (
                              <div className="pt-1 flex items-center justify-between">
                                <p className="text-xs text-amber-800 font-medium">
                                  Please download your current manuscript files and submit an updated version under Revisions.
                                </p>
                                <Link 
                                  href={`/author/revisions?id=${sub.id}`}
                                  className="text-xs font-bold text-amber-700 hover:text-amber-900 underline"
                                >
                                  Go to Revisions →
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-500 italic">No formal decision recorded yet.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
