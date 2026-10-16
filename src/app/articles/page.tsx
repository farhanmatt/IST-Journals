export const revalidate = 60;
import prisma from "@/lib/prisma";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { format } from "date-fns";
import { BookOpen, FileText, Download, Calendar, Search, X, Eye } from "lucide-react";

interface PublicArticlesArchivePageProps {
  searchParams?: {
    q?: string;
    year?: string;
  };
}

export default async function PublicArticlesArchivePage({ searchParams }: PublicArticlesArchivePageProps) {
  const query = searchParams?.q?.trim();
  const yearParam = searchParams?.year ? parseInt(searchParams.year) : undefined;

  const whereClause: any = {};
  if (query) {
    whereClause.OR = [
      { submission: { title: { contains: query, mode: "insensitive" } } },
      { submission: { abstract: { contains: query, mode: "insensitive" } } },
      { submission: { keywords: { contains: query, mode: "insensitive" } } },
      { submission: { author: { name: { contains: query, mode: "insensitive" } } } },
      { submission: { coAuthors: { some: { firstName: { contains: query, mode: "insensitive" } } } } },
      { submission: { coAuthors: { some: { lastName: { contains: query, mode: "insensitive" } } } } },
      { doi: { contains: query, mode: "insensitive" } },
    ];
  }
  if (yearParam && !isNaN(yearParam)) {
    whereClause.issue = { year: yearParam };
  }

  const [settingsRecords, articles, issues] = await Promise.all([
    prisma.journalSetting.findMany(),
    prisma.publishedArticle.findMany({
      where: whereClause,
      orderBy: { publishedAt: "desc" },
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
    }),
    prisma.issue.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ year: "desc" }, { volume: "desc" }, { issueNumber: "desc" }],
      include: {
        _count: { select: { articles: true } }
      }
    })
  ]);

  const settings = new Map(settingsRecords.map((s) => [s.key, s.value]));
  const journalName = settings.get("journalName") || "IST Journals";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <PublicHeader journalName={journalName} />

      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                <BookOpen className="w-4 h-4" />
                <span>Academic Publications</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Articles & Issues Archive</h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                Search and browse all peer-reviewed research articles and published issues.
              </p>
            </div>

            {/* Interactive Search Bar Form */}
            <form action="/articles" method="GET" className="relative max-w-2xl">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  name="q"
                  defaultValue={query || ""}
                  placeholder="Search articles by title, author, keyword, or DOI..." 
                  className="w-full bg-slate-50 text-slate-900 pl-12 pr-28 py-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-xs transition-all"
                />
                <button 
                  type="submit" 
                  className="absolute right-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg transition-colors shadow-xs"
                >
                  Search
                </button>
              </div>
            </form>

            {query && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-slate-500">Filtered by:</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                  &ldquo;{query}&rdquo;
                  <Link href="/articles" className="hover:text-blue-900 ml-1">
                    <X className="w-3.5 h-3.5" />
                  </Link>
                </span>
                <span className="text-slate-400 font-medium ml-2">
                  Found {articles.length} {articles.length === 1 ? "article" : "articles"}
                </span>
              </div>
            )}
          </div>

          {/* Issues Section */}
          {issues.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Published Issues</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {issues.map(iss => (
                  <Link
                    key={iss.id}
                    href={'/issue/' + iss.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 shadow-xs hover:shadow-md card-hover group flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                        Volume {iss.volume}, Issue {iss.issueNumber}
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-lg mt-1 group-hover:text-blue-600 transition-colors">
                        Year {iss.year}
                      </h3>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium">{iss._count.articles} {iss._count.articles === 1 ? 'article' : 'articles'}</span>
                      <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center">
                        View Issue &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All Articles Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              All Published Articles ({articles.length})
            </h2>

            {articles.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
                {articles.map((art) => {
                  const sub = art.submission;
                  const hasPdf = sub.files.some(f => f.type === "PRODUCTION_READY_PDF" || (f.type === "MANUSCRIPT" && f.originalName.toLowerCase().endsWith(".pdf")));

                  return (
                    <div key={art.id} className="p-6 sm:p-7 space-y-3 hover:bg-slate-50/60 transition-colors">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Link href={'/issue/' + art.issue.id} className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                          Vol. {art.issue.volume}, No. {art.issue.issueNumber} ({art.issue.year})
                        </Link>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-slate-500 font-medium">
                          {format(new Date(art.publishedAt), 'MMM d, yyyy')}
                        </span>
                        {sub.section && (
                          <>
                            <span className="text-slate-300">&bull;</span>
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[11px]">{sub.section.name}</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors leading-snug">
                        <Link href={'/article/' + art.id}>
                          {sub.title}
                        </Link>
                      </h3>

                      <p className="text-xs sm:text-sm font-semibold text-slate-700">
                        {sub.author.name}
                        {sub.coAuthors.length > 0 && " et al."}
                      </p>

                      {sub.abstract && (
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {sub.abstract}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                          {art.doi && <span>DOI: <span className="font-mono text-slate-700 font-medium">{art.doi}</span></span>}
                          {art.pageRange && <span>Pages: <span className="font-medium text-slate-700">{art.pageRange}</span></span>}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Link 
                            href={'/article/' + art.id} 
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
                          >
                            Details & Citation
                          </Link>
                          {hasPdf && (
                            <Link 
                              href={'/article/' + art.id + '/pdf'} 
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
                            >
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
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 shadow-xs">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-800">
                  {query ? "No Matching Articles Found" : "No Published Articles Yet"}
                </h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  {query 
                    ? `No published articles matched your search query "${query}". Try searching for other keywords, authors, or view the complete archive.`
                    : "Articles will appear here once approved and published by the editorial team."}
                </p>
                {query && (
                  <div className="mt-5">
                    <Link
                      href="/articles"
                      className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                    >
                      Clear Search Filter
                    </Link>
                  </div>
                )}
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
