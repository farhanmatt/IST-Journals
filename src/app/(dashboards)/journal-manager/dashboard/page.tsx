import prisma from "@/lib/prisma";
import { FileSignature, CheckCircle, XCircle, Users, LayoutDashboard, Clock, FileText, CheckCircle2 } from "lucide-react";

export default async function JournalManagerDashboardPage() {
  const editorialRoles = ["EDITOR", "SECTION_EDITOR", "REVIEWER", "COPYEDITOR", "PRODUCTION_EDITOR", "JOURNAL_MANAGER"];

  const [statusGroups, totalSubmissions, publishedArticles, totalTeam, recentSubmissions] = await Promise.all([
    prisma.submission.groupBy({
      by: ["status"],
      _count: { id: true }
    }),
    prisma.submission.count(),
    prisma.publishedArticle.count(),
    prisma.userRole.count({
      where: { role: { in: editorialRoles as any } }
    }),
    prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: true }
    })
  ]);

  const countMap: Record<string, number> = {};
  statusGroups.forEach((g) => {
    countMap[g.status] = g._count.id;
  });

  const newSubmissions = countMap["SUBMITTED"] || 0;
  const underReview = countMap["UNDER_REVIEW"] || 0;
  const revisionRequired = countMap["REVISION_REQUIRED"] || 0;
  const acceptedArticles = countMap["ACCEPTED"] || 0;
  const rejectedArticles = countMap["REJECTED"] || 0;

  const metrics = [
    { label: "Total Submissions", value: totalSubmissions, icon: FileSignature, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "New Submissions", value: newSubmissions, icon: LayoutDashboard, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Under Review", value: underReview, icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Revision Required", value: revisionRequired, icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Accepted", value: acceptedArticles, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Rejected", value: rejectedArticles, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Published Articles", value: publishedArticles, icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Editorial Team", value: totalTeam, icon: Users, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Overview</h1>
        <p className="text-slate-600">Real-time metrics and summary of journal activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4 transition-transform hover:-translate-y-1 hover:shadow-md">
            <div className={`p-4 rounded-full ${metric.bg} ${metric.color}`}>
              <metric.icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{metric.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Recent Submissions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Author</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {recentSubmissions.length > 0 ? recentSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{sub.submissionId}</td>
                  <td className="px-6 py-4 truncate max-w-xs">{sub.title}</td>
                  <td className="px-6 py-4">{sub.author.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {sub.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No submissions found.
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
