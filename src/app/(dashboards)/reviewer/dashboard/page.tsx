export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Inbox, FileText, CheckCircle, ArrowRight, Clock, ClipboardCheck } from "lucide-react";

export default async function ReviewerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [invitations, activeAssignments, completedReviews, recentInvitations] = await Promise.all([
    prisma.reviewerAssignment.count({ where: { reviewerId: userId, status: "INVITED" } }),
    prisma.reviewerAssignment.count({ where: { reviewerId: userId, status: "ACCEPTED" } }),
    prisma.reviewerAssignment.count({ where: { reviewerId: userId, status: "SUBMITTED" } }),
    prisma.reviewerAssignment.findMany({
      where: { reviewerId: userId, status: "INVITED" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { submission: { select: { title: true, submissionId: true } } }
    })
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Reviewer Dashboard</h1>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">Overview of your review invitations, active manuscripts, and completed reports.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        <Link 
          href="/reviewer/invitations"
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover hover:border-amber-300 card-hover flex items-center space-x-4 transition-all group"
        >
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-600 transition-colors">Pending Invitations</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">{invitations}</p>
          </div>
        </Link>

        <Link 
          href="/reviewer/assigned"
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover hover:border-blue-300 card-hover flex items-center space-x-4 transition-all group"
        >
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Active Assignments</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">{activeAssignments}</p>
          </div>
        </Link>

        <Link 
          href="/reviewer/completed"
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover hover:border-emerald-300 card-hover flex items-center space-x-4 transition-all group"
        >
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Completed Reviews</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">{completedReviews}</p>
          </div>
        </Link>
      </div>

      {recentInvitations.length > 0 && (
        <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Invitations</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manuscripts awaiting your review confirmation</p>
            </div>
            <Link href="/reviewer/invitations" className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ul className="space-y-3.5">
            {recentInvitations.map(inv => (
              <li key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 hover:bg-slate-100/70 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200/70">
                      {inv.submission.submissionId}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "No deadline"}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm sm:text-base leading-snug">{inv.submission.title}</p>
                </div>
                <Link 
                  href="/reviewer/invitations" 
                  className="self-start sm:self-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Respond
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
