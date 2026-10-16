import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, Eye, FileText } from "lucide-react";

export default async function PublishedArticlesPage() {
  const publishedArticles = await prisma.publishedArticle.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      submission: {
        select: {
          title: true,
          submissionId: true,
          author: { select: { name: true } }
        }
      },
      issue: {
        select: { volume: true, issueNumber: true, year: true }
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <CheckCircle2 className="w-6 h-6 mr-3 text-emerald-600" />
          Published Articles
        </h1>
        <p className="text-slate-600 mt-2">
          View all officially published articles along with their assigned issues, DOIs, and metrics.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-emerald-500" />
            Live Articles
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Manuscript ID</th>
                <th scope="col" className="px-6 py-4 font-semibold w-1/3">Title</th>
                <th scope="col" className="px-6 py-4 font-semibold">Author</th>
                <th scope="col" className="px-6 py-4 font-semibold">Issue</th>
                <th scope="col" className="px-6 py-4 font-semibold">Date Published</th>
                <th scope="col" className="px-6 py-4 font-semibold text-center">Metrics (V/D)</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {publishedArticles.length > 0 ? (
                publishedArticles.map((article) => (
                  <tr key={article.id} className="bg-white border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                      {article.submission.submissionId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 line-clamp-2">
                        {article.submission.title}
                      </div>
                      {article.doi && (
                        <div className="text-xs text-blue-600 mt-1">DOI: {article.doi}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {article.submission.author.name}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      Vol. {article.issue.volume}, No. {article.issue.issueNumber} ({article.issue.year})
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {format(new Date(article.publishedAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500 text-xs font-mono">
                      {article.views} / {article.downloads}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/dashboard/publication/published/${article.id}`}
                        className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-medium"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="font-medium text-slate-900">No published articles yet</p>
                      <p className="text-sm mt-1">Articles assigned to published issues will appear here.</p>
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