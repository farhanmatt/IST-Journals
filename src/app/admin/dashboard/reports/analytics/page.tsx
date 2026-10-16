import prisma from "@/lib/prisma";
import { BarChart, Users, FileText, Eye, Download, TrendingUp, CheckCircle2 } from "lucide-react";

export default async function AnalyticsPage() {
  // Fetch high-level stats
  const totalSubmissions = await prisma.submission.count();
  const totalUsers = await prisma.user.count();
  const totalPublished = await prisma.publishedArticle.count();
  
  const metrics = await prisma.publishedArticle.aggregate({
    _sum: {
      views: true,
      downloads: true,
    }
  });
  
  const totalViews = metrics._sum.views || 0;
  const totalDownloads = metrics._sum.downloads || 0;

  // Fetch breakdown of submissions by status
  const submissionsByStatus = await prisma.submission.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });

  // Calculate percentages for the CSS bars
  const maxStatusCount = Math.max(...submissionsByStatus.map(s => s._count.status), 1);
  const getStatusColor = (status: string) => {
    if (["ACCEPTED", "PUBLISHED", "COPYEDITING", "PRODUCTION", "SCHEDULED"].includes(status)) return "bg-emerald-500";
    if (["REJECTED", "DESK_REJECTED"].includes(status)) return "bg-red-500";
    if (["UNDER_REVIEW", "REVIEWS_COMPLETED", "REVISION_REQUIRED", "REVISION_SUBMITTED"].includes(status)) return "bg-amber-500";
    return "bg-blue-500"; // default for new/draft
  };
  
  const formatStatusName = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Fetch top performing articles
  const topArticles = await prisma.publishedArticle.findMany({
    orderBy: { views: 'desc' },
    take: 5,
    include: {
      submission: {
        select: { title: true, author: { select: { name: true } } }
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <BarChart className="w-6 h-6 mr-3 text-blue-600" />
          Journal Analytics
        </h1>
        <p className="text-slate-600 mt-2">
          Overview of journal performance, submission statistics, and readership metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Submissions</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalSubmissions}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Published Articles</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalPublished}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Views</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalViews.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Registered Users</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalUsers.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Breakdown Chart (CSS-based) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Submission Breakdown</h3>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-6">
            {submissionsByStatus.length > 0 ? (
              <div className="space-y-5">
                {submissionsByStatus.map((stat) => (
                  <div key={stat.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{formatStatusName(stat.status)}</span>
                      <span className="text-slate-500 font-semibold">{stat._count.status}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${getStatusColor(stat.status)}`} 
                        style={{ width: `${(stat._count.status / maxStatusCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No submissions data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Articles */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Top Performing Articles</h3>
            <Eye className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-0">
            {topArticles.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {topArticles.map((article, index) => (
                  <li key={article.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold text-sm mr-4">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {article.submission.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {article.submission.author.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end ml-4 space-y-1">
                      <div className="flex items-center text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <Eye className="w-3 h-3 mr-1" /> {article.views.toLocaleString()}
                      </div>
                      <div className="flex items-center text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <Download className="w-3 h-3 mr-1" /> {article.downloads.toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12 text-slate-500">
                No published articles available yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}