export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  FileSignature, FileText, CheckCircle, 
  XCircle, Globe, Clock, AlertCircle, ArrowRight 
} from "lucide-react";

export default async function AuthorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const authorId = session.user.id;

  // Retrieve metrics strictly for the logged-in author concurrently
  const [statusGroups, published, recentSubmissions] = await Promise.all([
    prisma.submission.groupBy({
      by: ["status"],
      where: { authorId },
      _count: { _all: true },
    }),
    prisma.publishedArticle.count({
      where: { submission: { authorId } },
    }),
    prisma.submission.findMany({
      where: { authorId },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const countsByStatus: Record<string, number> = {};
  let totalSubmissions = 0;
  for (const group of statusGroups) {
    countsByStatus[group.status] = group._count._all;
    totalSubmissions += group._count._all;
  }

  const drafts = countsByStatus["DRAFT"] || 0;
  const underReview = countsByStatus["UNDER_REVIEW"] || 0;
  const revisionRequired = countsByStatus["REVISION_REQUIRED"] || 0;
  const accepted = countsByStatus["ACCEPTED"] || 0;
  const rejected = countsByStatus["REJECTED"] || 0;

  const metrics = [
    { label: "Total Submissions", value: totalSubmissions, icon: FileSignature, href: "/author/submissions", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Drafts", value: drafts, icon: FileText, href: "/author/drafts", color: "text-slate-600", bg: "bg-slate-100" },
    { label: "Under Review", value: underReview, icon: Clock, href: "/author/submissions", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Revision Required", value: revisionRequired, icon: AlertCircle, href: "/author/revisions", color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Accepted", value: accepted, icon: CheckCircle, href: "/author/decisions", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Rejected", value: rejected, icon: XCircle, href: "/author/decisions", color: "text-red-600", bg: "bg-red-50" },
    { label: "Published", value: published, icon: Globe, href: "/author/published", color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome, {session.user.name}</h1>
          <p className="text-slate-500 mt-1 text-sm">Here is an overview of your submitted manuscripts and pending actions.</p>
        </div>
        <Link 
          href="/author/submit"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm shadow-blue-500/20 whitespace-nowrap hover:-translate-y-0.5 active:translate-y-0"
        >
          <FileSignature className="w-4.5 h-4.5 mr-2" />
          Submit New Manuscript
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
        {metrics.map((metric, index) => (
          <Link key={index} href={metric.href} className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 hover:shadow-md hover:border-blue-300 card-hover group">
            <div className="flex items-center space-x-3.5">
              <div className={`p-3 rounded-xl ${metric.bg} ${metric.color} group-hover:scale-105 transition-transform shadow-xs`}>
                <metric.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{metric.label}</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight mt-0.5">{metric.value}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
            <p className="text-xs text-slate-500 mt-0.5">Your most recently updated manuscripts</p>
          </div>
          <Link href="/author/submissions" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center group transition-colors">
            <span>View All</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Submission ID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentSubmissions.length > 0 ? recentSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-slate-700 text-xs">{sub.submissionId}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900 truncate max-w-sm">{sub.title || "Untitled Draft"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                    {sub.updatedAt.toLocaleDateString()}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium text-sm">No submissions found</p>
                      <Link href="/author/submit" className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-semibold hover:underline">
                        Start your first submission &rarr;
                      </Link>
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
