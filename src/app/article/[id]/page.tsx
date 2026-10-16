export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { format } from "date-fns";
import { 
  FileText, Download, Calendar, BookOpen, 
  ExternalLink, ArrowLeft, Eye, Award, CheckCircle 
} from "lucide-react";

export default async function PublicArticlePage({ params }: { params: { id: string } }) {
  // Update views counter atomically and fetch journal settings in parallel
  const articlePromise = prisma.publishedArticle.update({
    where: { id: params.id },
    data: { views: { increment: 1 } },
    include: {
      issue: true,
      submission: {
        include: {
          author: true,
          coAuthors: true,
          section: true,
          files: true
        }
      }
    }
  }).catch(async () => {
    // If not found by publishedArticle.id, try finding by submissionId
    const foundBySub = await prisma.publishedArticle.findUnique({
      where: { submissionId: params.id },
      include: {
        issue: true,
        submission: {
          include: {
            author: true,
            coAuthors: true,
            section: true,
            files: true
          }
        }
      }
    });
    if (foundBySub) {
      await prisma.publishedArticle.update({
        where: { id: foundBySub.id },
        data: { views: { increment: 1 } }
      }).catch(() => null);
    }
    return foundBySub;
  });

  const [article, settingsRecords] = await Promise.all([
    articlePromise,
    prisma.journalSetting.findMany()
  ]);

  if (!article || !article.submission) {
    return notFound();
  }

  const { submission, issue } = article;
  const settings = new Map(settingsRecords.map((s) => [s.key, s.value]));
  const journalName = settings.get("journalName") || "IST Journals";

  // Identify galley files using type and originalName
  const pdfFile = submission.files.find(f => f.type === "PRODUCTION_READY_PDF") 
    || submission.files.find(f => f.type === "MANUSCRIPT" && f.originalName.toLowerCase().endsWith(".pdf"));
  const htmlFile = submission.files.find(f => f.type === "PRODUCTION_READY_HTML");
  const supplementaryFiles = submission.files.filter(f => f.type === "SUPPLEMENTARY");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <PublicHeader journalName={journalName} />

      <main className="flex-grow py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Breadcrumb / Back link */}
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500 overflow-x-auto pb-1">
            <Link href="/" className="hover:text-blue-600 transition-colors font-medium">Home</Link>
            <span className="text-slate-300">/</span>
            <Link href="/articles" className="hover:text-blue-600 transition-colors font-medium">Articles</Link>
            <span className="text-slate-300">/</span>
            <Link href={'/issue/' + issue.id} className="hover:text-blue-600 transition-colors font-medium whitespace-nowrap">
              Vol. {issue.volume}, No. {issue.issueNumber} ({issue.year})
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-semibold truncate max-w-xs">{submission.title}</span>
          </div>

          {/* Article Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow p-6 sm:p-10 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                {submission.section?.name || "Original Research"}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Peer Reviewed & Published
              </span>
              <span className="text-xs font-medium text-slate-500 ml-auto flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {article.views} views
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-[1.25] tracking-tight">
              {submission.title}
            </h1>

            {/* Authors */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-sm sm:text-base font-bold text-slate-900">
                {submission.author.name}
                {submission.coAuthors.length > 0 && ", " + submission.coAuthors.map(c => c.firstName + ' ' + c.lastName).join(", ")}
              </p>
              {submission.coAuthors.length > 0 && (
                <div className="text-xs text-slate-500 space-y-1">
                  {submission.coAuthors.map(c => c.affiliation && (
                    <p key={c.id}><span className="font-semibold text-slate-600">{c.firstName} {c.lastName}:</span> {c.affiliation}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Publication Metadata & Galley Download Buttons */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 text-xs text-slate-600">
                <p>
                  <span className="font-bold text-slate-700">Issue:</span>{' '}
                  <Link href={'/issue/' + issue.id} className="text-blue-600 font-semibold hover:underline">
                    Volume {issue.volume}, Issue {issue.issueNumber} ({issue.year})
                  </Link>
                </p>
                {article.doi && (
                  <p>
                    <span className="font-bold text-slate-700">DOI:</span>{' '}
                    <span className="font-mono text-blue-700 font-semibold">{article.doi}</span>
                  </p>
                )}
                {article.pageRange && (
                  <p><span className="font-bold text-slate-700">Pages:</span> {article.pageRange}</p>
                )}
                <p>
                  <span className="font-bold text-slate-700">Published:</span>{' '}
                  {format(new Date(article.publishedAt), 'MMMM d, yyyy')}
                </p>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-wrap gap-2.5">
                {pdfFile && (
                  <a
                    href={'/article/' + article.id + '/pdf'}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </a>
                )}
                {htmlFile && (
                  <a
                    href={htmlFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Read HTML
                  </a>
                )}
              </div>
            </div>

            {/* Abstract */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Abstract
              </h2>
              <div className="text-sm sm:text-base text-slate-700 leading-relaxed space-y-4">
                {submission.abstract ? (
                  <p className="leading-relaxed">{submission.abstract}</p>
                ) : (
                  <p className="text-slate-400 italic">No abstract provided for this article.</p>
                )}
              </div>
            </div>

            {/* Keywords */}
            {submission.keywords && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {submission.keywords.split(',').map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200/60">
                      {kw.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Supplementary Materials if available */}
            {supplementaryFiles.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplementary Materials</h3>
                <div className="space-y-2">
                  {supplementaryFiles.map(file => (
                    <a
                      key={file.id}
                      href={file.url}
                      download
                      className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200/60 gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-500" />
                      <span>{file.originalName}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Citation Box */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">How to Cite</h3>
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-mono text-slate-700 leading-relaxed">
                {submission.author.name}{submission.coAuthors.length > 0 ? " et al." : ""}. ({new Date(article.publishedAt).getFullYear()}). {submission.title}. <i>{journalName}</i>, {issue.volume}({issue.issueNumber}){article.pageRange ? ", " + article.pageRange : ""}. {article.doi ? "https://doi.org/" + article.doi : ""}
              </div>
            </div>

          </div>

          {/* Back to issue button */}
          <div className="text-center pt-4">
            <Link
              href={'/issue/' + issue.id}
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Volume {issue.volume}, Issue {issue.issueNumber} Table of Contents
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
