import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { 
  Search, BookOpen, Users, FileText, 
  ChevronRight, Award, Globe, ShieldCheck, 
  BarChart, ArrowRight, Download, Eye, Calendar,
  CheckCircle, Layers, Scale, Sparkles, HelpCircle, 
  FileCheck, ExternalLink, ArrowUpRight, Bookmark
} from "lucide-react";

export const revalidate = 60;

function formatRole(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Editor-in-Chief / Administrator";
    case "JOURNAL_MANAGER":
      return "Journal Manager";
    case "EDITOR":
      return "Associate Editor";
    case "SECTION_EDITOR":
      return "Section Editor";
    default:
      return role.replace(/_/g, " ");
  }
}

export default async function LandingPage() {
  // Fetch configurations, current issue, latest articles, archives, stats, and editorial team in parallel
  const [
    settingsRecords,
    currentIssue,
    latestArticles,
    archiveIssues,
    totalArticles,
    totalIssues,
    totalAuthors,
    totalSubmissions,
    totalSections,
    editorsList
  ] = await Promise.all([
    prisma.journalSetting.findMany(),
    prisma.issue.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: [{ year: "desc" }, { volume: "desc" }, { issueNumber: "desc" }],
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
    }),
    prisma.publishedArticle.findMany({
      orderBy: { publishedAt: "desc" },
      take: 6,
      include: {
        submission: {
          include: {
            author: true,
            coAuthors: true,
            section: true,
            files: true
          }
        },
        issue: true
      }
    }),
    prisma.issue.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ year: "desc" }, { volume: "desc" }, { issueNumber: "desc" }],
      take: 4,
      include: {
        _count: { select: { articles: true } }
      }
    }),
    prisma.publishedArticle.count(),
    prisma.issue.count({ where: { status: "PUBLISHED" } }),
    prisma.userRole.count({ where: { role: "AUTHOR" } }),
    prisma.submission.count(),
    prisma.section.count({ where: { status: true } }),
    prisma.userRole.findMany({
      where: { role: { in: ["ADMIN", "JOURNAL_MANAGER", "EDITOR", "SECTION_EDITOR"] } },
      include: { user: true },
      orderBy: { id: "asc" },
      take: 8
    })
  ]);

  const settings = new Map(settingsRecords.map((s) => [s.key, s.value]));

  const journalName = settings.get("journalName") || "IST Journals";
  const tagline = settings.get("tagline") || "Advancing the frontiers of science through rigorous, open-access, peer-reviewed scholarship.";
  const description = settings.get("description") || "An international, peer-reviewed, open-access journal providing a rapid and rigorous platform for the publication of original research papers, reviews, and short communications across the full spectrum of science, technology, and engineering.";
  const publisher = settings.get("publisher") || "IST Journals";
  const email = settings.get("email") || "contact@journal.org";
  const phone = settings.get("phone") || "+1 (555) 123-4567";
  const address = settings.get("address") || "Academic Publishing Center, 500 Innovation Way";
  const issn = settings.get("issn") || "2831-7721 (Online)";
  const frequency = settings.get("frequency") || "Quarterly";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <PublicHeader journalName={journalName} />

      <main className="flex-grow">
        {/* ========================================================= */}
        {/* 1. HERO SECTION                                           */}
        {/* ========================================================= */}
        <section id="home" className="relative bg-white border-b border-slate-200/80 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-slate-50/40 pointer-events-none" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32 flex flex-col items-center text-center">
            
            {/* Live Open Access & ISSN Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
              <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200/80 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span>Open Access Peer-Reviewed Journal</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 bg-slate-100 border border-slate-200/90 text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold font-mono shadow-xs">
                <span className="text-blue-600 font-bold">ISSN:</span>
                <span>{issn}</span>
              </div>
            </div>
            
            {/* Journal Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl leading-[1.15] mb-6">
              {journalName}
            </h1>
            
            {/* Tagline */}
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mb-10 leading-relaxed font-normal">
              {tagline}
            </p>
            
            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center px-8 py-3.5 text-sm sm:text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 gap-2 group"
              >
                <span>Submit Manuscript</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href={currentIssue ? `/issue/${currentIssue.id}` : "#current-issue"} 
                className="inline-flex items-center justify-center px-8 py-3.5 text-sm sm:text-base font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 gap-2"
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>View Current Issue</span>
              </Link>
            </div>

            {/* Quick Fact Strip */}
            <div className="mt-14 pt-8 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-4xl w-full text-left">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Double-Blind</div>
                  <div className="text-[11px] text-slate-500">Peer Review Process</div>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                <Globe className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">CC BY 4.0</div>
                  <div className="text-[11px] text-slate-500">Open Access Model</div>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">{frequency}</div>
                  <div className="text-[11px] text-slate-500">Publishing Schedule</div>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                <Award className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">COPE Aligned</div>
                  <div className="text-[11px] text-slate-500">Ethical Standards</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. ABOUT THE JOURNAL SECTION                             */}
        {/* ========================================================= */}
        <section id="about" className="py-20 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">
              
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Aims & Scope</span>
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">About the Journal</h2>
                </div>

                <p className="text-base text-slate-600 leading-relaxed">
                  {description}
                </p>

                <p className="text-sm text-slate-600 leading-relaxed">
                  The journal prioritizes innovative theoretical developments, rigorous empirical studies, multidisciplinary reviews, and high-impact applied research. Our editorial mission is to bridge academic scholarship and technological applications through impartial and constructive peer review.
                </p>

                {/* Key Publishing Features Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ISSN</h4>
                    <p className="text-sm font-bold text-slate-900 mt-1">{issn}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Review Model</h4>
                    <p className="text-sm font-bold text-slate-900 mt-1">Double-Blind</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Publication Frequency</h4>
                    <p className="text-sm font-bold text-slate-900 mt-1">{frequency}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Publisher</h4>
                    <p className="text-sm font-bold text-slate-900 mt-1 truncate">{publisher}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Licensing</h4>
                    <p className="text-sm font-bold text-slate-900 mt-1">CC BY 4.0</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Similarity Check</h4>
                    <p className="text-sm font-bold text-slate-900 mt-1">iThenticate / Plagiarism</p>
                  </div>
                </div>

                {/* Subject Areas */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    Core Subject Areas & Disciplines
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Information Security & Privacy",
                      "Artificial Intelligence & Machine Learning",
                      "Distributed Systems & Cloud Computing",
                      "Network Architecture & Telecommunications",
                      "Data Science & Statistical Computing",
                      "Software Engineering & Verification",
                      "Cryptographic Engineering",
                      "Cyber-Physical Systems & IoT"
                    ].map((area) => (
                      <span key={area} className="px-3 py-1 bg-white border border-slate-200/80 text-slate-700 text-xs font-medium rounded-lg shadow-2xs">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scope Side Graphic Card */}
              <div className="lg:col-span-5 mt-10 lg:mt-0">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs space-y-6">
                  <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Open Access & Repository Policy</h3>
                      <p className="text-xs text-slate-500">Unrestricted global scholarly distribution</p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    This journal provides immediate, global open access to all published content on the principle that making research freely available to the public supports a greater global exchange of knowledge.
                  </p>

                  <div className="space-y-3 pt-2 text-xs text-slate-600">
                    <div className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Authors retain copyright without restrictions under Creative Commons (CC BY 4.0).</span>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Zero embargo period: final published PDFs are immediately accessible to the world.</span>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Archiving allowed in institutional and subject repositories immediately upon publication.</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Have questions regarding submissions?</span>
                    <Link href="#contact" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                      Contact Editorial Office &rarr;
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. CURRENT ISSUE SECTION                                  */}
        {/* ========================================================= */}
        <section id="current-issue" className="py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                  <Bookmark className="w-4 h-4" />
                  <span>Latest Issue</span>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Current Issue</h2>
                <p className="text-slate-600 mt-1 text-sm sm:text-base">
                  {currentIssue 
                    ? `Volume ${currentIssue.volume}, Issue ${currentIssue.issueNumber} (${currentIssue.year})`
                    : "The latest published issue and table of contents."}
                </p>
              </div>
              {currentIssue && (
                <Link
                  href={`/issue/${currentIssue.id}`}
                  className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group"
                >
                  <span>View Full Issue Table of Contents</span>
                  <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {currentIssue ? (
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-8">
                {/* Issue Header Info Card */}
                <div className="flex flex-col md:flex-row gap-6 items-start justify-between pb-6 border-b border-slate-200/70">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-20 sm:w-20 sm:h-28 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md flex items-center justify-center text-white shrink-0">
                      <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white/90" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        Current Issue
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                        Volume {currentIssue.volume}, Issue {currentIssue.issueNumber} ({currentIssue.year})
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Published: {currentIssue.publishedAt ? format(new Date(currentIssue.publishedAt), 'MMMM d, yyyy') : currentIssue.year}
                      </p>
                      {currentIssue.description && (
                        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl pt-1 leading-relaxed">
                          {currentIssue.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/issue/${currentIssue.id}`}
                    className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors shrink-0"
                  >
                    <span>View Complete Issue</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </div>

                {/* Table of Contents */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Table of Contents ({currentIssue.articles.length} {currentIssue.articles.length === 1 ? 'Article' : 'Articles'})
                  </h4>

                  {currentIssue.articles.length > 0 ? (
                    <div className="space-y-3.5">
                      {currentIssue.articles.map((art) => {
                        const pdfFile = art.submission.files.find(
                          (f) => f.type === "PRODUCTION_READY_PDF" || (f.type === "MANUSCRIPT" && f.originalName.toLowerCase().endsWith(".pdf"))
                        );

                        return (
                          <div 
                            key={art.id} 
                            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1.5 flex-grow pr-4">
                              {art.submission.section && (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                  {art.submission.section.name}
                                </span>
                              )}
                              <h5 className="font-bold text-slate-900 text-sm sm:text-base hover:text-blue-600 transition-colors leading-snug">
                                <Link href={`/article/${art.id}`}>
                                  {art.submission.title}
                                </Link>
                              </h5>
                              <p className="text-xs text-slate-600 font-medium">
                                {art.submission.author.name}
                                {art.submission.coAuthors.length > 0 && " et al."}
                              </p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                                {art.doi && <span>DOI: <span className="font-mono text-slate-600">{art.doi}</span></span>}
                                {art.pageRange && <span>Pages: {art.pageRange}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Link
                                href={`/article/${art.id}`}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                <span>Article</span>
                              </Link>
                              {pdfFile && (
                                <a
                                  href={pdfFile.url}
                                  download={pdfFile.originalName || `${art.submission.title}.pdf`}
                                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
                                >
                                  <Download className="w-3.5 h-3.5 mr-1" />
                                  <span>PDF</span>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-xl border border-slate-200/80 text-center text-slate-500">
                      <p className="text-sm">Articles for this issue are currently in production.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">Inaugural Issue In Preparation</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  The inaugural issue of {journalName} is currently compiling accepted peer-reviewed submissions. Authors are invited to submit their manuscripts.
                </p>
                <div className="mt-5">
                  <Link
                    href="/login"
                    className="inline-flex items-center px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Submit Your Manuscript Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. LATEST PUBLISHED ARTICLES                              */}
        {/* ========================================================= */}
        <section id="articles" className="py-20 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                  <FileText className="w-4 h-4" />
                  <span>Peer-Reviewed Literature</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Latest Published Articles</h2>
                <p className="text-slate-600 mt-1 text-sm sm:text-base">
                  Recently published original research, reviews, and short communications
                </p>
              </div>
              {latestArticles.length > 0 && (
                <Link
                  href="/articles"
                  className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors self-start md:self-auto group"
                >
                  <span>Browse All Published Articles</span>
                  <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {latestArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestArticles.map((article) => {
                  const pdfFile = article.submission.files.find(
                    (f) => f.type === "PRODUCTION_READY_PDF" || (f.type === "MANUSCRIPT" && f.originalName.toLowerCase().endsWith(".pdf"))
                  );
                  const htmlFile = article.submission.files.find(
                    (f) => f.type === "PRODUCTION_READY_HTML"
                  );
                  const suppFiles = article.submission.files.filter(
                    (f) => f.type === "SUPPLEMENTARY"
                  );

                  return (
                    <div
                      key={article.id}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 card-hover flex flex-col p-6 group"
                    >
                      {/* Top Metadata */}
                      <div className="flex items-center justify-between text-xs mb-3 pb-3 border-b border-slate-100">
                        <Link
                          href={`/issue/${article.issue.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wide truncate max-w-[70%]"
                        >
                          Vol {article.issue.volume}, No {article.issue.issueNumber} ({article.issue.year})
                        </Link>
                        <span className="text-slate-400 font-medium shrink-0">
                          {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                        </span>
                      </div>

                      {/* Section Badge */}
                      {article.submission.section && (
                        <div className="mb-2.5">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                            {article.submission.section.name}
                          </span>
                        </div>
                      )}

                      {/* Article Title */}
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">
                        <Link href={`/article/${article.id}`} title={article.submission.title}>
                          {article.submission.title}
                        </Link>
                      </h3>

                      {/* Authors */}
                      <p className="text-xs text-slate-600 mb-3 font-medium line-clamp-1">
                        {article.submission.author.name}
                        {article.submission.coAuthors.length > 0 && " et al."}
                      </p>

                      {/* Abstract */}
                      <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed flex-grow">
                        {article.submission.abstract || "No abstract available for this article."}
                      </p>

                      {/* DOI & Pages */}
                      {(article.doi || article.pageRange) && (
                        <div className="text-[11px] text-slate-400 mb-4 flex flex-wrap gap-x-3 gap-y-1">
                          {article.doi && (
                            <span className="truncate max-w-full">
                              DOI: <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer" className="font-mono text-slate-600 hover:text-blue-600 hover:underline">{article.doi}</a>
                            </span>
                          )}
                          {article.pageRange && (
                            <span>Pages: {article.pageRange}</span>
                          )}
                        </div>
                      )}

                      {/* Action Links & Galleys */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100 mt-auto">
                        <Link
                          href={`/article/${article.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Article</span>
                        </Link>

                        <div className="flex items-center gap-1.5">
                          {pdfFile && (
                            <a
                              href={pdfFile.url}
                              download={pdfFile.originalName || `${article.submission.title}.pdf`}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
                              title="Download PDF galley"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </a>
                          )}
                          {htmlFile && (
                            <a
                              href={htmlFile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                              title="View full HTML"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>HTML</span>
                            </a>
                          )}
                          {suppFiles.length > 0 && (
                            <span 
                              className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                              title="Supplementary files available"
                            >
                              +{suppFiles.length} Supp
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-slate-800">No Published Articles Yet</h3>
                <p className="text-sm text-slate-500 mt-1">Articles will appear here once approved and published.</p>
              </div>
            )}
            
            {latestArticles.length > 0 && (
              <div className="mt-12 text-center">
                <Link
                  href="/articles"
                  className="inline-flex items-center px-6 py-3 border border-slate-300 text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs hover:shadow-md"
                >
                  <span>Explore Complete Articles Archive</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. ARCHIVES / PREVIOUS ISSUES SECTION                     */}
        {/* ========================================================= */}
        <section id="archives" className="py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                  <Layers className="w-4 h-4" />
                  <span>Journal Issues</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Issues Archive</h2>
                <p className="text-slate-600 mt-1 text-sm sm:text-base">
                  Browse previous issues and historical volumes published by the journal.
                </p>
              </div>
              <Link
                href="/articles"
                className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group"
              >
                <span>Browse All Volumes & Issues</span>
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {archiveIssues.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {archiveIssues.map((iss) => (
                  <Link
                    key={iss.id}
                    href={`/issue/${iss.id}`}
                    className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/20 shadow-xs hover:shadow-md card-hover group flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                        Volume {iss.volume}, Issue {iss.issueNumber}
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-xl mt-1 group-hover:text-blue-600 transition-colors">
                        Year {iss.year}
                      </h3>
                      {iss.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {iss.description}
                        </p>
                      )}
                    </div>
                    <div className="pt-4 mt-6 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium">{iss._count.articles} {iss._count.articles === 1 ? 'article' : 'articles'}</span>
                      <span className="text-blue-600 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center">
                        View Issue &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500">
                <p className="text-sm">Issues will appear in the archive once published.</p>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. EDITORIAL TEAM SECTION                                 */}
        {/* ========================================================= */}
        <section id="editorial-team" className="py-20 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                <Users className="w-4 h-4" />
                <span>Governance & Peer Review</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Editorial Board</h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                Our journal is governed by an international board of recognized scholars committed to editorial integrity, rigorous peer review, and academic excellence.
              </p>
            </div>

            {editorsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {editorsList.map((editor) => (
                  <div key={editor.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 text-center shadow-xs hover:shadow-md card-hover">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center border border-blue-200/60 shadow-xs">
                      <Users className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">{editor.user.name}</h3>
                    <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">
                      {formatRole(editor.role)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      Editorial Review Board
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 italic text-sm">Editorial board is currently being formed.</p>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. AUTHOR GUIDELINES SECTION                              */}
        {/* ========================================================= */}
        <section id="guidelines" className="py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                <FileCheck className="w-4 h-4" />
                <span>For Prospective Authors</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Author Guidelines</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
                Everything you need to know about preparing and submitting your manuscript to {journalName}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {/* Card 1: Manuscript Preparation */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    01
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Manuscript Structure</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Manuscripts must follow the standard academic IMRaD format: Title, Abstract (max 250 words), Keywords (4-6), Introduction, Methods, Results, Discussion, and References.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 text-[11px] font-semibold text-blue-700">
                  Standard IMRaD Format
                </div>
              </div>

              {/* Card 2: Article Types */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    02
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Accepted Article Types</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    We welcome Original Research Articles (5,000–8,000 words), Systematic Reviews (up to 10,000 words), Short Communications (up to 3,500 words), and Technical Methodologies.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 text-[11px] font-semibold text-blue-700">
                  Full & Short Papers
                </div>
              </div>

              {/* Card 3: Formatting & References */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    03
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Formatting & References</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Submit in editable formats (DOCX, LaTeX, PDF). References should adhere to standard IEEE or APA style with DOIs included for all cited literature. Figures must be 300+ DPI.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 text-[11px] font-semibold text-blue-700">
                  IEEE / APA with DOIs
                </div>
              </div>

              {/* Card 4: Submission Checklist */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    04
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Online Submission</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Our 5-step submission wizard guides you through metadata entry, anonymized manuscript file upload, co-author management, and conflict of interest declaration.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 text-[11px] font-semibold text-blue-700">
                  Streamlined 5-Step Process
                </div>
              </div>
            </div>

            {/* CTA Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/80 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-lg font-bold text-slate-900">Ready to Submit Your Research?</h4>
                <p className="text-sm text-slate-600">
                  Create an author account or log in to track your manuscript through our peer review system.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/register"
                  className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm rounded-xl shadow-xs transition-colors"
                >
                  Register as Author
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs shadow-blue-500/20 transition-colors"
                >
                  Submit Manuscript
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================= */}
        {/* 8. PEER REVIEW & PUBLICATION POLICIES                     */}
        {/* ========================================================= */}
        <section id="policies" className="py-20 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                <Scale className="w-4 h-4" />
                <span>Publishing Ethics & Standards</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Peer Review & Publication Policies</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
                We uphold the highest standards of publication ethics, rigor, transparency, and research integrity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Double-Blind Peer Review */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Double-Blind Peer Review</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Both reviewer and author identities remain anonymous throughout evaluation. Each manuscript undergoes screening followed by independent evaluation by at least two qualified reviewers.
                </p>
              </div>

              {/* Publication Ethics (COPE) */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">COPE Publication Ethics</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  The journal adheres strictly to the Committee on Publication Ethics (COPE) Core Practices. We proactively investigate suspected misconduct, data manipulation, or duplicate submission.
                </p>
              </div>

              {/* Plagiarism & Similarity Policy */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Plagiarism Screening</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  All submissions are checked for similarity against published literature prior to review using automated plagiarism detection software. Manuscripts with high similarity are promptly rejected.
                </p>
              </div>

              {/* Conflict of Interest */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Conflict of Interest</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Authors, editors, and reviewers must disclose any commercial, financial, or personal relationships that could inappropriately influence their work or decisions.
                </p>
              </div>

              {/* Open Access & CC-BY Licensing */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Open Access Licensing</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Published articles are licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). Readers can freely read, download, copy, distribute, and link to the full texts.
                </p>
              </div>

              {/* Research Data & Archiving */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Data Sharing & Archiving</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Authors are encouraged to share research data, code, and supplementary materials in trusted public repositories to promote transparency and reproducible scientific enquiry.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 9. SEARCH & ANNOUNCEMENTS SECTION                         */}
        {/* ========================================================= */}
        <section id="search" className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-y border-blue-700 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Search Box */}
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-200 mb-2">
                  <Search className="w-4 h-4" />
                  <span>Research Discovery</span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight mb-4">Search Published Research</h2>
                <p className="text-blue-100 mb-8 max-w-md text-sm sm:text-base leading-relaxed">
                  Explore our comprehensive database of peer-reviewed articles by title, author name, keyword, or DOI identifier.
                </p>
                <form className="relative max-w-lg" action="/articles" method="GET">
                  <input 
                    type="text" 
                    name="q"
                    placeholder="Search articles, authors, keywords..." 
                    className="w-full bg-white text-slate-900 px-5 py-3.5 rounded-xl pr-14 focus:outline-none focus:ring-4 focus:ring-blue-400/40 text-sm shadow-md"
                  />
                  <button 
                    type="submit" 
                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-xs"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>
              </div>
              
              {/* Important Announcements */}
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-xl">
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-blue-200" />
                  Public Announcements
                </h3>
                <div className="space-y-4">
                  <div className="bg-black/10 backdrop-blur-xs p-4 rounded-xl border border-white/10">
                    <span className="text-xs font-bold text-blue-200 uppercase tracking-wider block mb-1">Call for Papers</span>
                    <h4 className="font-bold mb-1 text-sm">Special Issue on Advanced Security & Privacy</h4>
                    <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                      Manuscripts are invited for our upcoming special issue covering zero-knowledge proofs, post-quantum cryptography, and AI privacy.
                    </p>
                  </div>
                  <div className="bg-black/10 backdrop-blur-xs p-4 rounded-xl border border-white/10">
                    <span className="text-xs font-bold text-blue-200 uppercase tracking-wider block mb-1">Editorial Policy</span>
                    <h4 className="font-bold mb-1 text-sm">Updated Anonymization Guidelines for Authors</h4>
                    <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                      Please ensure all uploaded manuscript files have identifying author metadata, acknowledgements, and institutional affiliations removed prior to review.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 10. REAL JOURNAL STATISTICS                               */}
        {/* ========================================================= */}
        <section id="stats" className="py-16 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Journal Metrics & Community</h3>
              <p className="text-xl font-bold text-slate-900 mt-1">Real-Time Publishing Statistics</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 mb-1">{totalArticles}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Published Articles</div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 mb-1">{totalIssues}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Published Issues</div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 mb-1">{totalAuthors}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Authors</div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 mb-1">{totalSubmissions}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manuscripts Processed</div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <PublicFooter 
        journalName={journalName} 
        publisher={publisher} 
        email={email} 
        phone={phone} 
        issn={issn}
        address={address}
      />
    </div>
  );
}
