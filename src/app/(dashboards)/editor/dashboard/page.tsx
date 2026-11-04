import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { FileText, Clock, Users, CheckCircle, AlertCircle, FilePlus, Eye, BookOpen, Edit, Archive, ArrowRight } from "lucide-react";

export default async function EditorDashboardOverview() {
  const session = await getServerSession(authOptions);

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
    { name: "New Submissions", count: newCount, icon: FilePlus, color: "text-blue-600", bg: "bg-blue-50 border-blue-100", href: "/editor/submissions/new" },
    { name: "Pending Screening", count: screeningCount, icon: SearchIcon, color: "text-purple-600", bg: "bg-purple-50 border-purple-100", href: "/editor/submissions/screening" },
    { name: "Under Review", count: underReviewCount, icon: Eye, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100", href: "/editor/submissions/under-review" },
    { name: "Completed Reviews", count: reviewsCompletedCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", href: "/editor/submissions/completed-reviews" },
    { name: "Final Approval", count: finalApprovalCount, icon: CheckCircle, color: "text-teal-600", bg: "bg-teal-50 border-teal-100", href: "/editor/submissions/final-approval" },
    { name: "Published", count: publishedCount, icon: Archive, color: "text-green-600", bg: "bg-green-50 border-green-100", href: "/editor/submissions/archive?tab=accepted" },
    { name: "Pending Decisions", count: reviewsCompletedCount + revisionsSubmittedCount, icon: BookOpen, color: "text-amber-600", bg: "bg-amber-50 border-amber-100", href: "/editor/submissions/decisions" },
    { name: "Rejected", count: rejectedCount + deskRejectedCount, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50 border-rose-100", href: "/editor/submissions/archive?tab=rejected" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Editor Dashboard</h1>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">Overview of journal submissions, reviewer reports, and editorial actions.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover hover:border-blue-300 card-hover flex items-center space-x-4 transition-all group"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} border flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">{stat.name}</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">{stat.count}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recently Completed Reviews */}
      {recentCompletedReviews.length > 0 && (
        <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Recently Completed Reviews</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Reviewer reports and recommendations awaiting editorial decisions.
              </p>
            </div>
            <Link 
              href="/editor/submissions/completed-reviews" 
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center group transition-colors"
            >
              <span>View All ({reviewsCompletedCount})</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentCompletedReviews.map((rev) => {
              const recColor = 
                rev.recommendation === "ACCEPT"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                  : rev.recommendation === "REJECT"
                  ? "bg-rose-50 text-rose-700 border-rose-200/80"
                  : "bg-amber-50 text-amber-800 border-amber-200/80";

              return (
                <div key={rev.id} className="p-6 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/70">
                          {rev.submission.submissionId}
                        </span>
                        <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase border shadow-2xs ${recColor}`}>
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

                    <div className="flex items-center shrink-0">
                      <Link
                        href={`/editor/submissions/${rev.submission.id}`}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <span>View Report & Decide</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Link>
                    </div>
                  </div>

                  {rev.commentsForAuthor && (
                    <div className="mt-3.5 p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-600 line-clamp-2 border border-slate-200/70 leading-relaxed">
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
      <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Submissions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest manuscripts submitted by authors</p>
          </div>
          <Link href="/editor/submissions" className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-slate-700 text-xs whitespace-nowrap">{sub.submissionId}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs truncate group-hover:text-blue-600 transition-colors" title={sub.title}>{sub.title}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium text-xs sm:text-sm whitespace-nowrap">{sub.author.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs">
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                    {sub.updatedAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link href={`/editor/submissions/${sub.id}`} className="text-blue-600 hover:text-blue-800 font-bold text-xs sm:text-sm transition-colors py-1 px-2 rounded-lg hover:bg-blue-50">
                      View
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-500 font-medium">
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

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
