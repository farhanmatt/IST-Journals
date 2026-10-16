export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Inbox,
  PlayCircle
} from "lucide-react";

export default async function CopyEditorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Fetch real statistics and journal settings in a single concurrent batch
  const [journalSetting, statusGroups, dueSoonCount, assignments] = await Promise.all([
    prisma.journalSetting.findFirst({
      where: { key: "journalName" }
    }).catch(() => null),
    prisma.copyeditorAssignment.groupBy({
      by: ["status"],
      where: { copyeditorId: userId },
      _count: { _all: true },
    }),
    prisma.copyeditorAssignment.count({
      where: {
        copyeditorId: userId,
        status: { not: "COMPLETED" },
        dueDate: {
          not: null,
          lte: nextWeek
        }
      }
    }),
    prisma.copyeditorAssignment.findMany({
      where: { copyeditorId: userId },
      orderBy: { assignedAt: "desc" },
      take: 10,
      include: {
        submission: {
          include: {
            author: { select: { name: true, email: true } },
            section: { select: { name: true } },
            files: { select: { id: true, type: true } }
          }
        }
      }
    })
  ]);

  const journalName = journalSetting?.value || "IST Journals";

  const statusMap: Record<string, number> = {};
  let totalAssigned = 0;
  for (const g of statusGroups) {
    statusMap[g.status] = g._count._all;
    totalAssigned += g._count._all;
  }
  const pendingCount = statusMap["ASSIGNED"] || 0;
  const inProgressCount = statusMap["IN_PROGRESS"] || 0;
  const completedCount = statusMap["COMPLETED"] || 0;

  const statCards = [
    {
      title: "Total Assigned",
      value: totalAssigned,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      href: "/copyeditor/assigned"
    },
    {
      title: "Pending Copyediting",
      value: pendingCount,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      href: "/copyeditor/pending"
    },
    {
      title: "In Progress",
      value: inProgressCount,
      icon: PlayCircle,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      href: "/copyeditor/assigned"
    },
    {
      title: "Completed Copyediting",
      value: completedCount,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      href: "/copyeditor/completed"
    },
    {
      title: "Tasks Due Soon",
      value: dueSoonCount,
      icon: AlertCircle,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
      href: "/copyeditor/assigned"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Copyeditor Dashboard</h1>
        <p className="text-slate-500 text-sm">
          Track assigned manuscripts, perform language & reference styling, and upload copyedited files.
        </p>
      </div>

      {/* 5 Real Database Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`p-5 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${card.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Assigned Manuscripts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Assigned Manuscripts</h2>
            <p className="text-xs text-slate-500">Manuscripts assigned to you by journal editors</p>
          </div>
          <Link
            href="/copyeditor/assigned"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View All ({totalAssigned}) &rarr;
          </Link>
        </div>

        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Submission ID</th>
                  <th className="py-3.5 px-4">Manuscript Title</th>
                  <th className="py-3.5 px-4">Journal Name</th>
                  <th className="py-3.5 px-4">Assigned Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {assignments.map((assignment) => {
                  const sub = assignment.submission;
                  const statusFormatted = assignment.status.replace(/_/g, " ");

                  return (
                    <tr key={assignment.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-xs text-slate-900 whitespace-nowrap">
                        {sub.submissionId}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          href={`/copyeditor/assigned/${sub.id}`}
                          className="font-medium text-slate-900 hover:text-emerald-600 line-clamp-1"
                        >
                          {sub.title || "Untitled Manuscript"}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">Author: {sub.author?.name || "Unknown"}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {journalName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        {assignment.dueDate ? (
                          <span className={new Date(assignment.dueDate) < now && assignment.status !== "COMPLETED" ? "text-rose-600 font-semibold" : "text-slate-600"}>
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No deadline</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          assignment.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : assignment.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {statusFormatted}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {assignment.status === "ASSIGNED" ? (
                          <Link
                            href={`/copyeditor/assigned/${sub.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                          >
                            <span>Start Copyediting</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : assignment.status === "IN_PROGRESS" ? (
                          <Link
                            href={`/copyeditor/assigned/${sub.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                          >
                            <span>Continue Copyediting</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href={`/copyeditor/assigned/${sub.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            <span>View Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <p className="text-slate-800 font-semibold mb-1">No assigned manuscripts</p>
            <p className="text-slate-500 text-xs">
              Manuscripts sent to you by editors will appear here for copyediting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
