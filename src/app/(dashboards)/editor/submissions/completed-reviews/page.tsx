export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  XCircle,
  Clock, 
  User, 
  MessageSquare, 
  ShieldAlert,
  Inbox
} from "lucide-react";
import { CompletedReviewActions } from "./CompletedReviewActions";

export default async function CompletedReviewsPage() {
  await getServerSession(authOptions);

  // Auto-synchronize any submissions with completed reviews to REVIEWS_COMPLETED or REJECTED
  try {
    const underReviewCandidates = await prisma.submission.findMany({
      where: {
        status: "UNDER_REVIEW",
        reviewerAssignments: {
          some: { status: "SUBMITTED" },
          none: { status: { in: ["INVITED", "ACCEPTED"] } }
        }
      },
      include: {
        reviewerAssignments: {
          where: { status: "SUBMITTED" },
          orderBy: { submittedAt: "desc" },
          take: 1
        }
      }
    });

    for (const sub of underReviewCandidates) {
      const rec = sub.reviewerAssignments[0]?.recommendation;
      const targetStatus = rec === "REJECT" ? "REJECTED" : "REVIEWS_COMPLETED";
      await prisma.submission.update({
        where: { id: sub.id },
        data: { status: targetStatus, updatedAt: new Date() }
      });
    }
  } catch (syncErr) {
    console.warn("Status synchronization notice:", syncErr);
  }

  const submissions = await prisma.submission.findMany({
    where: {
      OR: [
        { status: "REVIEWS_COMPLETED" },
        { reviewerAssignments: { some: { status: "SUBMITTED" } } }
      ]
    },
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { name: true, email: true } },
      reviewerAssignments: {
        where: { status: "SUBMITTED" },
        include: { reviewer: { select: { name: true, email: true } } },
        orderBy: { submittedAt: "desc" }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Completed Reviews</h1>
        <p className="text-slate-500">
          Reviews finished, reviewer reports, recommendations, and awaiting editorial decisions.
        </p>
      </div>

      {submissions.length > 0 ? (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const completedReviews = sub.reviewerAssignments;

            return (
              <div 
                key={sub.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-slate-300 transition-all"
              >
                {/* Header row */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {sub.submissionId}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        sub.status === "REJECTED" || sub.status === "DESK_REJECTED"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : sub.status === "ACCEPTED" || sub.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : sub.status === "REVISION_REQUIRED"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }`}>
                        {sub.status === "REJECTED" || sub.status === "DESK_REJECTED" ? (
                          <XCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        {sub.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 pt-1">{sub.title || "Untitled"}</h2>
                    <p className="text-xs text-slate-500">
                      Author: <span className="font-medium text-slate-700">{sub.author?.name}</span> ({sub.author?.email})
                    </p>
                  </div>

                  <div>
                    <CompletedReviewActions
                      submissionId={sub.id}
                      submissionTitle={sub.title || "Untitled"}
                      recommendation={completedReviews[0]?.recommendation}
                    />
                  </div>
                </div>

                {/* Review reports list */}
                <div className="p-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Submitted Reviewer Reports ({completedReviews.length})
                  </h3>

                  {completedReviews.map((rev) => {
                    const recColor = 
                      rev.recommendation === "ACCEPT"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : rev.recommendation === "REJECT"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : rev.recommendation === "MAJOR_REVISION"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-amber-50 text-amber-700 border-amber-200";

                    return (
                      <div 
                        key={rev.id} 
                        className="rounded-lg border border-slate-200 p-4 bg-white space-y-3 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-semibold text-slate-900">{rev.reviewer.name}</span>
                            <span className="text-xs text-slate-500">({rev.reviewer.email})</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${recColor}`}>
                              Recommendation: {rev.recommendation?.replace(/_/g, " ") || "None"}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              {rev.submittedAt ? new Date(rev.submittedAt).toLocaleDateString() : "Submitted"}
                            </span>
                          </div>
                        </div>

                        {/* Comments preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          <div>
                            <div className="flex items-center text-xs font-semibold text-slate-600 mb-1">
                              <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              <span>Comments for Author</span>
                            </div>
                            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-3">
                              {rev.commentsForAuthor || <span className="italic text-slate-400">No author comments.</span>}
                            </p>
                          </div>

                          {rev.commentsForEditor && (
                            <div>
                              <div className="flex items-center text-xs font-semibold text-amber-800 mb-1">
                                <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                <span>Confidential Comments for Editor</span>
                              </div>
                              <p className="text-xs text-amber-950 bg-amber-50/70 p-3 rounded-lg border border-amber-200 line-clamp-3">
                                {rev.commentsForEditor}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No completed reviews</h3>
          <p className="text-slate-500">There are currently no completed review reports awaiting editorial decision.</p>
        </div>
      )}
    </div>
  );
}
