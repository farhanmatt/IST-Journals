export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Inbox, FileText, CheckCircle, ArrowRight } from "lucide-react";

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Reviewer Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Overview of your review invitations, active manuscripts, and completed reports.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md card-hover flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-xs">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Invitations</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mt-0.5">{invitations}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md card-hover flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Assignments</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mt-0.5">{activeAssignments}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md card-hover flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-xs">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Reviews</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mt-0.5">{completedReviews}</p>
          </div>
        </div>
      </div>

      {recentInvitations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Invitations</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manuscripts awaiting your review confirmation</p>
            </div>
            <Link href="/reviewer/invitations" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              View All
            </Link>
          </div>
          <ul className="space-y-3">
            {recentInvitations.map(inv => (
              <li key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/60 hover:bg-slate-100/70 transition-colors">
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-snug">{inv.submission.title}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "No deadline"}</p>
                </div>
                <Link 
                  href="/reviewer/invitations" 
                  className="self-start sm:self-auto px-4 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
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
