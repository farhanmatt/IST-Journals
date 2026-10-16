import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { FileText, Clock, Users, CheckCircle, AlertCircle, FilePlus, Eye, BookOpen, Edit, Archive, ArrowRight } from "lucide-react";

export default async function EditorDashboardOverview() {
  const session = await getServerSession(authOptions);
  // Layout already verified session and role, but we need it for editorId if we restrict by handlingEditorId in the future.
  // For now, we assume this editor sees all submissions or we would filter by section/handlingEditor.

  // Fetch counts and recent items in a single concurrent batch
  const [
    statusGroups,
    reviewsCompletedCount,
    recentSubmissions,
    recentCompletedReviews
  ] = await Promise.all([
    prisma.submission.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.submission.count({
      where: {
        OR: [
          { status: "REVIEWS_COMPLETED" },
          { reviewerAssignments: { some: { status: "SUBMITTED" } } }
        ]
      }
    }),
    prisma.submission.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { name: true } },
        section: { select: { name: true } }
      },
      where: {
        status: { not: "DRAFT" }
      }
    }),
    prisma.reviewerAssignment.findMany({
      where: { status: "SUBMITTED" },
      take: 5,
      orderBy: { submittedAt: "desc" },
      include: {
        submission: { select: { id: true, submissionId: true, title: true, status: true } },
        reviewer: { select: { name: true, email: true } }
      }
    })
  ]);

  const counts: Record<string, number> = {};
  for (const g of statusGroups) {
    counts[g.status] = g._count._all;
  }

  const newCount = counts["SUBMITTED"] || 0;
  const screeningCount = counts["INITIAL_SCREENING"] || 0;
  const underReviewCount = counts["UNDER_REVIEW"] || 0;
  const revisionsRequiredCount = counts["REVISION_REQUIRED"] || 0;
  const revisionsSubmittedCount = counts["REVISION_SUBMITTED"] || 0;
  const finalApprovalCount = (counts["PENDING_FINAL_APPROVAL"] || 0) + (counts["PRODUCTION_CORRECTIONS_REQUIRED"] || 0);
  const publishedCount = counts["PUBLISHED"] || 0;
  const acceptedCount = counts["ACCEPTED"] || 0;
  const rejectedCount = counts["REJECTED"] || 0;
  const deskRejectedCount = counts["DESK_REJECTED"] || 0;

  const stats = [
    { name: "New Submissions", count: newCount, icon: FilePlus, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Pending Screening", count: screeningCount, icon: Search, color: "text-purple-600", bg: "bg-purple-50" },
    { name: "Under Review", count: underReviewCount, icon: Eye, color: "text-indigo-600", bg: "bg-indigo-50" },
    { name: "Completed Reviews", count: reviewsCompletedCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Final Approval", count: finalApprovalCount, icon: CheckCircle, color: "text-teal-600", bg: "bg-teal-50", href: "/editor/submissions/final-approval" },
    { name: "Published", count: publishedCount, icon: Archive, color: "text-green-600", bg: "bg-green-50", href: "/articles" },
    { name: "Pending Decisions", count: reviewsCompletedCount + revisionsSubmittedCount, icon: BookOpen, color: "text-amber-600", bg: "bg-amber-50" },
    { name: "Rejected", count: rejectedCount + deskRejectedCount, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Editor Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Overview of journal submissions, reviewer reports, and editorial tasks.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md card-hover flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0 shadow-xs`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.name}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mt-0.5">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recently Completed Reviews */}
      {recentCompletedReviews.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recently Completed Reviews</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Reviewer reports and recommendations awaiting editorial decisions.
              </p>
            </div>
            <Link 
              href="/editor/submissions/completed-reviews" 
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center group transition-colors"
            >
              <span>View All ({reviewsCompletedCount})</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentCompletedReviews.map((rev) => {
              const recColor = 
                rev.recommendation === "ACCEPT"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : rev.recommendation === "REJECT"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200";

              return (
                <div key={rev.id} className="p-6 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                          {rev.submission.submissionId}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${recColor}`}>
                          {rev.recommendation?.replace(/_/g, " ") || "Review Submitted"}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {rev.submittedAt ? new Date(rev.submittedAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 pt-0.5 leading-snug">
                        {rev.submission.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Reviewer: <span className="font-semibold text-slate-700">{rev.reviewer.name}</span> ({rev.reviewer.email})
                      </p>
                    </div>

                    <div className="flex items-center">
                      <Link
                        href={`/editor/submissions/${rev.submission.id}`}
                        className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-xl text-xs sm:text-sm transition-colors border border-blue-200/50"
                      >
                        <span>View Report & Decide</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Link>
                    </div>
                  </div>

                  {rev.commentsForAuthor && (
                    <div className="mt-3.5 p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 line-clamp-2 border border-slate-200/60 leading-relaxed">
                      <span className="font-bold text-slate-700">Comments: </span>
                      {rev.commentsForAuthor}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Submissions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest manuscripts submitted by authors</p>
          </div>
          <Link href="/editor/submissions" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Submission ID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentSubmissions.length > 0 ? recentSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-slate-700 text-xs">{sub.submissionId}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs truncate" title={sub.title}>{sub.title}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium text-xs sm:text-sm">{sub.author.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                    {sub.updatedAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/editor/submissions/${sub.id}`} className="text-blue-600 hover:text-blue-800 font-semibold text-xs sm:text-sm transition-colors">
                      View
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No recent submissions found.
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

const Search = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
