import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Users, BookOpen, Edit3, ClipboardCheck, AlertCircle, CheckCircle, FileText, Activity } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  // Fetch Summary Stats efficiently with groupBy
  const [
    totalUsers,
    roleGroups,
    submissionGroups,
    recentSubmissions,
    recentLogs
  ] = await Promise.all([
    prisma.user.count(),
    prisma.userRole.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.submission.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { author: true }
    }),
    prisma.auditLog.findMany({
      take: 7,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
  ]);

  const rolesMap: Record<string, number> = {};
  for (const r of roleGroups) {
    rolesMap[r.role] = r._count._all;
  }
  const totalAuthors = rolesMap["AUTHOR"] || 0;
  const totalReviewers = rolesMap["REVIEWER"] || 0;
  const totalEditors = rolesMap["EDITOR"] || 0;

  const subMap: Record<string, number> = {};
  let totalSubmissions = 0;
  for (const s of submissionGroups) {
    subMap[s.status] = s._count._all;
    totalSubmissions += s._count._all;
  }
  const underReview = subMap["UNDER_REVIEW"] || 0;
  const revisionRequired = subMap["REVISION_REQUIRED"] || 0;
  const accepted = subMap["ACCEPTED"] || 0;
  const rejected = subMap["REJECTED"] || 0;
  const published = subMap["PUBLISHED"] || 0;

  const statCards = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    { label: "Total Authors", value: totalAuthors, icon: Edit3, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    { label: "Total Reviewers", value: totalReviewers, icon: ClipboardCheck, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    { label: "Total Editors", value: totalEditors, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
  ];

  const submissionCards = [
    { label: "Total Submissions", value: totalSubmissions, icon: FileText, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
    { label: "Under Review", value: underReview, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
    { label: "Revision Required", value: revisionRequired, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
    { label: "Accepted / Published", value: accepted + published, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-[13px] text-slate-500 mt-1 font-medium">Welcome back, {session?.user?.name || "System Administrator"}. Here&apos;s what&apos;s happening today.</p>
        </div>
      </div>

      {/* User Stats */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">User Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200/60 p-5 flex items-center space-x-4">
              <div className={`p-3 rounded-xl border ${stat.bg} ${stat.color} shadow-sm`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-500">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Submission Stats */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Submission Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {submissionCards.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200/60 p-5 flex items-center space-x-4">
              <div className={`p-3 rounded-xl border ${stat.bg} ${stat.color} shadow-sm`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-500">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <section className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-slate-400" />
                Recent Submissions
              </h2>
              <Link href="/admin/dashboard/submissions" className="text-[13px] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-100">
                    <th className="px-5 py-3 font-semibold">ID</th>
                    <th className="px-5 py-3 font-semibold">Title</th>
                    <th className="px-5 py-3 font-semibold">Author</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">No submissions found.</td>
                    </tr>
                  ) : (
                    recentSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-5 py-3.5 text-[13px] font-mono text-slate-400">#{sub.submissionId || sub.id.substring(0,6)}</td>
                        <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700 max-w-[200px] truncate group-hover:text-blue-600 transition-colors">{sub.title}</td>
                        <td className="px-5 py-3.5 text-[13px] font-medium text-slate-500">{sub.author.name}</td>
                        <td className="px-5 py-3.5 text-[13px]">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60 uppercase tracking-wider">
                            {sub.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[13px] text-slate-400 font-medium text-right whitespace-nowrap">
                          {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Recent Activities */}
        <section>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-slate-400" />
                System Activity
              </h2>
              <Link href="/admin/dashboard/audit-logs" className="text-[13px] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                Logs
              </Link>
            </div>
            <div className="p-5 flex-1">
              <div className="space-y-0 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {recentLogs.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">No recent activity.</p>
                ) : (
                  recentLogs.map((log, i) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border-[3px] border-white bg-blue-500 shadow shrink-0 z-10" />
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 p-3 rounded-lg border border-slate-100 bg-white shadow-sm group-hover:border-blue-100 group-hover:shadow-md transition-all">
                        <p className="text-[13px] text-slate-700 font-bold mb-1">{log.action}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-medium text-slate-400 truncate pr-2">
                            {log.user?.name || "System"}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }).replace('about ', '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
