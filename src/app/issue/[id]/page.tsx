export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { format } from "date-fns";
import { BookOpen, Calendar, Download, FileText, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <PublicHeader journalName={journalName} />

      <main className="flex-grow py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href="/articles" className="hover:text-blue-600">Issues & Articles</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Vol. {issue.volume}, No. {issue.issueNumber} ({issue.year})</span>
          </div>

          {/* Issue Header */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-44 bg-slate-100 rounded-lg border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {issue.coverImage ? (
                <img src={issue.coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-16 h-16 text-slate-400" />
              )}
            </div>

            <div className="flex-grow space-y-3">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Published Issue
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900">
                Volume {issue.volume}, Issue {issue.issueNumber} ({issue.year})
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Published: {issue.publishedAt ? format(new Date(issue.publishedAt), 'MMMM yyyy') : issue.year}
              </p>
              {issue.description && (
                <p className="text-sm text-slate-600 pt-2 border-t border-slate-100">
                  {issue.description}
                </p>
              )}
            </div>
          </div>

          {/* Table of Contents */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Table of Contents</span>
              <span className="text-xs font-normal text-slate-500">
                {issue.articles.length} {issue.articles.length === 1 ? 'Article' : 'Articles'}
              </span>
            </h2>

            {issue.articles.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {issue.articles.map((art) => {
                  const sub = art.submission;
                  const hasPdf = sub.files.some(f => f.type === "PRODUCTION_READY_PDF" || (f.type === "MANUSCRIPT" && f.originalName.toLowerCase().endsWith(".pdf")));

                  return (
                    <div key={art.id} className="py-6 first:pt-0 last:pb-0 space-y-2">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {sub.section?.name || "Articles"}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors">
                        <Link href={'/article/' + art.id}>
                          {sub.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-slate-600">
                        {sub.author.name}
                        {sub.coAuthors.length > 0 && " et al."}
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          {art.doi && <span>DOI: {art.doi}</span>}
                          {art.pageRange && <span>Pages: {art.pageRange}</span>}
                        </div>

                        <div className="flex items-center space-x-3">
                          <Link href={'/article/' + art.id} className="text-blue-600 font-medium hover:underline">
                            Abstract
                          </Link>
                          {hasPdf && (
                            <Link href={'/article/' + art.id + '/pdf'} className="inline-flex items-center text-blue-600 font-medium hover:underline">
                              PDF <Download className="w-3 h-3 ml-1" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p>No articles published in this issue yet.</p>
              </div>
            )}
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
