export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { format } from "date-fns";
import { BookOpen, Calendar, Download, FileText, ArrowLeft, Eye, Bookmark } from "lucide-react";

export default async function PublicIssuePage({ params }: { params: { id: string } }) {
  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    include: {
      articles: {
        orderBy: { publishedAt: "asc" },
        include: {
          submission: {
            include: {
              author: true,
              coAuthors: true,
              section: true,
              files: true
            }
          }
        }
      }
    }
  });

  if (!issue) {
    return notFound();
  }

  const settingsRecords = await prisma.journalSetting.findMany();
  const settings = new Map(settingsRecords.map((s) => [s.key, s.value]));
  const journalName = settings.get("journalName") || "IST Journals";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <PublicHeader journalName={journalName} />

      <main className="flex-grow py-10 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-600 font-medium transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link href="/articles" className="hover:text-blue-600 font-medium transition-colors">Issues & Articles</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-semibold">Vol. {issue.volume}, No. {issue.issueNumber} ({issue.year})</span>
          </div>

          {/* Issue Header */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-44 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-2xl shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden ring-2 ring-white text-white">
              {issue.coverImage ? (
                <img src={issue.coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-14 h-14 text-white/90" />
              )}
            </div>

            <div className="flex-grow space-y-3">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
                Published Journal Issue
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Volume {issue.volume}, Issue {issue.issueNumber} ({issue.year})
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                Published: {issue.publishedAt ? format(new Date(issue.publishedAt), 'MMMM d, yyyy') : issue.year}
              </p>
              {issue.description && (
                <p className="text-xs sm:text-sm text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
                  {issue.description}
                </p>
              )}
            </div>
          </div>

          {/* Table of Contents */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-10 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 pb-4 border-b border-slate-100 flex items-center justify-between">
              <span>Table of Contents</span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {issue.articles.length} {issue.articles.length === 1 ? 'Article' : 'Articles'}
              </span>
            </h2>

            {issue.articles.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {issue.articles.map((art) => {
                  const sub = art.submission;
                  const hasPdf = sub.files.some(f => f.type === "PRODUCTION_READY_PDF" || (f.type === "MANUSCRIPT" && f.originalName.toLowerCase().endsWith(".pdf")));

                  return (
                    <div key={art.id} className="py-6 first:pt-0 last:pb-0 space-y-2.5">
                      <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                        {sub.section?.name || "Articles"}
                      </div>
                      
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors leading-snug">
                        <Link href={'/article/' + art.id}>
                          {sub.title}
                        </Link>
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 font-medium">
                        {sub.author.name}
                        {sub.coAuthors.length > 0 && " et al."}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          {art.doi && <span>DOI: <span className="font-mono text-slate-700 font-semibold">{art.doi}</span></span>}
                          {art.pageRange && <span>Pages: <span className="font-semibold text-slate-700">{art.pageRange}</span></span>}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Link 
                            href={'/article/' + art.id}
                            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>Details</span>
                          </Link>
                          {hasPdf && (
                            <Link 
                              href={'/article/' + art.id + '/pdf'}
                              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
                            >
                              <span>PDF</span>
                              <Download className="w-3.5 h-3.5 ml-1" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                No articles published in this issue yet.
              </div>
            )}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/articles"
              className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to All Issues & Articles Archive</span>
            </Link>
          </div>

        </div>
      </main>

      <PublicFooter 
        journalName={journalName} 
        publisher={settings.get("publisher") || "IST Journals"} 
        email={settings.get("email") || "contact@journal.org"} 
        phone={settings.get("phone") || "+1 (555) 123-4567"} 
        issn={settings.get("issn") || "XXXX-XXXX (Online)"}
      />
    </div>
  );
}
