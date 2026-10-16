export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookMarked, FileText, Calendar, ExternalLink, Inbox, CheckCircle2, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/date";

export default async function ProductionIssuesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const issues = await prisma.issue.findMany({
    orderBy: [{ year: "desc" }, { volume: "desc" }, { issueNumber: "desc" }],
    include: {
      articles: {
        include: {
          submission: {
            include: {
              author: { select: { name: true, email: true } },
              files: {
                where: {
                  type: { in: ["PRODUCTION_READY_PDF", "PRODUCTION_READY_HTML"] }
                },
                select: { id: true, type: true, url: true, originalName: true }
              }
            }
          }
        }
      }
    }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Issues & Publication Schedule</h1>
        <p className="text-slate-500 text-sm">
          Browse journal issues, scheduled publications, and assigned article galleys.
        </p>
      </div>

      {issues.length > 0 ? (
        <div className="space-y-6">
          {issues.map((issue) => {
            const isPublished = issue.status === "PUBLISHED";

            return (
              <div 
                key={issue.id} 
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Issue Header */}
                <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      <BookMarked className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">
                          Vol. {issue.volume} No. {issue.issueNumber} ({issue.year})
                        </h2>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          isPublished 
                            ? "bg-emerald-100 text-emerald-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {issue.description || "Regular Journal Issue"} &bull; {issue.articles.length} Article(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {issue.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Published: {new Date(issue.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Articles List */}
                <div className="p-5">
                  {issue.articles.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {issue.articles.map(({ id, doi, pageRange, submission }) => (
                        <div key={id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                              {submission.title || "Untitled Manuscript"}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                              <span>Author: {submission.author?.name || "Unknown"}</span>
                              {doi && <span>&bull; DOI: <span className="font-mono text-slate-700">{doi}</span></span>}
                              {pageRange && <span>&bull; Pages: {pageRange}</span>}
                              <span>&bull; ID: {submission.submissionId}</span>
                            </div>
                          </div>

                          {/* Galley Links */}
                          <div className="flex items-center gap-2 shrink-0">
                            {submission.files.map((file) => (
                              <a
                                key={file.id}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{file.type === "PRODUCTION_READY_PDF" ? "PDF Proof" : "Galley"}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      No articles assigned to this issue yet.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-slate-800 font-semibold mb-1">No Journal Issues Found</h3>
          <p className="text-slate-500 text-xs">
            Issues created by the journal manager will appear here for publication scheduling.
          </p>
        </div>
      )}
    </div>
  );
}
