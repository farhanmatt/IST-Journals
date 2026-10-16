export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Inbox, Clock, Calendar } from "lucide-react";
import { InvitationActionsClient } from "./InvitationActionsClient";

export default async function ReviewerInvitationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const invitations = await prisma.reviewerAssignment.findMany({
    where: { reviewerId: userId, status: "INVITED" },
    orderBy: { createdAt: "desc" },
    include: { submission: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Review Invitations</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Review requests from editors to evaluate manuscripts.</p>
      </div>

      {invitations.length > 0 ? (
        <div className="space-y-4">
          {invitations.map(inv => (
            <div key={inv.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                      New Invitation
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-500">ID: {inv.submission.submissionId}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{inv.submission.title}</h2>
                </div>
                {inv.dueDate && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/70">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Abstract</h3>
                <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {inv.submission.abstract || "No abstract provided."}
                </p>
              </div>

              <InvitationActionsClient assignmentId={inv.id} submissionId={inv.submission.id} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-16 text-center">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No pending invitations</h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            You do not have any new review requests at the moment. When an editor invites you, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
