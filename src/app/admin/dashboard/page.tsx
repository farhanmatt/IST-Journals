import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Users, BookOpen, Edit3, ClipboardCheck, AlertCircle, CheckCircle, FileText, Activity, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  // Fetch Summary Stats efficiently with groupBy
  let totalUsers = 0;
  let roleGroups: { role: string; _count: { _all: number } }[] = [];
  let submissionGroups: { status: string; _count: { _all: number } }[] = [];
  let recentSubmissions: any[] = [];
  let recentLogs: any[] = [];

  try {
    const res = await Promise.all([
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
    totalUsers = res[0] as number;
    roleGroups = res[1] as any;
    submissionGroups = res[2] as any;
    recentSubmissions = res[3] as any;
    recentLogs = res[4] as any;
  } catch (dbErr) {
    console.error("Database fetch error on admin dashboard:", dbErr);
  }

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
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50 border-blue-100", href: "/admin/dashboard/users" },
    { label: "Total Authors", value: totalAuthors, icon: Edit3, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", href: "/admin/dashboard/users?role=AUTHOR" },
    { label: "Total Reviewers", value: totalReviewers, icon: ClipboardCheck, color: "text-amber-600", bg: "bg-amber-50 border-amber-100", href: "/admin/dashboard/users?role=REVIEWER" },
    { label: "Total Editors", value: totalEditors, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50 border-purple-100", href: "/admin/dashboard/users?role=EDITOR" },
  ];

  const submissionCards = [
    { label: "Total Submissions", value: totalSubmissions, icon: FileText, color: "text-slate-600", bg: "bg-slate-50 border-slate-200", href: "/admin/dashboard/submissions" },
    { label: "Under Review", value: underReview, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100", href: "/admin/dashboard/submissions/under-review" },
    { label: "Revision Required", value: revisionRequired, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50 border-rose-100", href: "/admin/dashboard/submissions/revisions" },
    { label: "Accepted / Published", value: accepted + published, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", href: "/admin/dashboard/submissions/accepted" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Welcome back, {session?.user?.name || "System Administrator"}. Here&apos;s your system activity today.</p>
        </div>
      </div>

      {/* User Stats */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">User Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((stat, i) => (
            <Link 
              key={i} 
              href={stat.href}
              className="bg-white rounded-2xl shadow-card hover:shadow-card-hover hover:border-blue-300 transition-all border border-slate-200/80 p-5 flex items-center space-x-4 card-hover group"
            >
              <div className={`p-3 rounded-2xl border ${stat.bg} ${stat.color} shadow-2xs group-hover:scale-105 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{stat.value}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Submission Stats */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Submission Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {submissionCards.map((stat, i) => (
            <Link 
              key={i} 
              href={stat.href}
              className="bg-white rounded-2xl shadow-card hover:shadow-card-hover hover:border-blue-300 transition-all border border-slate-200/80 p-5 flex items-center space-x-4 card-hover group"
            >
              <div className={`p-3 rounded-2xl border ${stat.bg} ${stat.color} shadow-2xs group-hover:scale-105 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{stat.value}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <section className="xl:col-span-2">
          <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <h2 className="text-sm font-bold text-slate-900 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-slate-400" />
                Recent Submissions
              </h2>
              <Link href="/admin/dashboard/submissions" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-3.5 font-bold">ID</th>
                    <th className="px-6 py-3.5 font-bold">Title</th>
                    <th className="px-6 py-3.5 font-bold">Author</th>
                    <th className="px-6 py-3.5 font-bold">Status</th>
                    <th className="px-6 py-3.5 font-bold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No submissions found.</td>
                    </tr>
                  ) : (
                    recentSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-3.5 text-xs font-mono font-bold text-slate-500">#{sub.submissionId || sub.id.substring(0,6)}</td>
                        <td className="px-6 py-3.5 text-xs sm:text-sm font-semibold text-slate-800 max-w-[220px] truncate group-hover:text-blue-600 transition-colors">{sub.title}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-500 font-medium whitespace-nowrap">{sub.author?.name || "Unknown Author"}</td>
                        <td className="px-6 py-3.5 text-xs whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 uppercase tracking-wider">
                            {sub.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-400 font-medium text-right whitespace-nowrap">
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
          <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 flex flex-col h-full">
            <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <h2 className="text-sm font-bold text-slate-900 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-slate-400" />
                System Activity
              </h2>
              <Link href="/admin/dashboard/audit-logs" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1">
                <span>All Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-6 flex-1">
              <div className="space-y-0 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500/20 before:via-slate-200 before:to-transparent">
                {recentLogs.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">No recent activity.</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border-[3px] border-white bg-blue-600 shadow shrink-0 z-10 ring-2 ring-blue-100" />
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 p-3.5 rounded-2xl border border-slate-100 bg-white shadow-2xs group-hover:border-blue-200 group-hover:shadow-card transition-all">
                        <p className="text-xs sm:text-[13px] text-slate-800 font-bold mb-1 leading-snug">{log.action}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-medium text-slate-400 truncate pr-2">
                            {log.user?.name || "System"}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
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
