export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Globe, FileText, Download, Eye, ArrowRight, BookOpen } from "lucide-react";

export default async function AuthorPublishedArticlesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const publishedArticles = await prisma.publishedArticle.findMany({
    where: { submission: { authorId: session.user.id } },
    orderBy: { publishedAt: "desc" },
    include: {
      issue: true,
      submission: {
        include: {
          section: true,
          files: true,
        }
      }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Published Articles</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Your peer-reviewed research published in official journal issues.</p>
        </div>
      </div>

      {publishedArticles.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 p-14 text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3.5 border border-blue-100">
            <Globe className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Published Articles Yet</h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed mb-5">
            Once your accepted manuscripts finish copyediting and production, your published papers will appear here with live DOI links.
          </p>
          <Link
            href="/author/submissions"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <span>View Submissions in Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
          {publishedArticles.map((art) => {
            const pdfFile = art.submission.files.find(
              (f) => f.type === "PRODUCTION_READY_PDF" || (f.type === "MANUSCRIPT" && f.originalName.toLowerCase().endsWith(".pdf"))
            );

            return (
              <div key={art.id} className="p-6 sm:p-8 space-y-3 hover:bg-slate-50/70 transition-colors">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-blue-600">
                    Vol. {art.issue.volume}, No. {art.issue.issueNumber} ({art.issue.year})
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-slate-500 font-medium">
                    Published {format(new Date(art.publishedAt), 'MMMM d, yyyy')}
                  </span>
                  {art.submission.section && (
                    <>
                      <span className="text-slate-300">&bull;</span>
                      <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[11px] border border-blue-200/60">
                        {art.submission.section.name}
                      </span>
                    </>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors leading-snug">
                  <Link href={`/article/${art.id}`}>
                    {art.submission.title}
                  </Link>
                </h2>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    {art.doi && <span>DOI: <span className="font-mono text-slate-700 font-bold">{art.doi}</span></span>}
                    {art.pageRange && <span>Pages: <span className="font-semibold text-slate-700">{art.pageRange}</span></span>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/article/${art.id}`}
                      className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      <span>View Public Article</span>
                    </Link>
                    {pdfFile && (
                      <a
                        href={pdfFile.url}
                        download={pdfFile.originalName || `${art.submission.title}.pdf`}
                        className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        <span>PDF</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
