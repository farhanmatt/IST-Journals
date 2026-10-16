export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SubmissionsTable } from "../../components/SubmissionsTable";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, UserPlus } from "lucide-react";
import { AssignReviewerClient } from "./AssignReviewerClient";

export default async function AssignReviewersPage({ searchParams }: { searchParams: { id?: string } }) {
  await getServerSession(authOptions);

  // Auto-synchronize manuscripts where all assigned reviewers have submitted
  try {
    await prisma.submission.updateMany({
      where: {
        status: "UNDER_REVIEW",
        reviewerAssignments: {
          some: { status: "SUBMITTED" },
          none: { status: { in: ["INVITED", "ACCEPTED"] } }
        }
      },
      data: {
        status: "REVIEWS_COMPLETED",
        updatedAt: new Date()
      }
    });
  } catch (syncErr) {
    console.warn("Status synchronization notice:", syncErr);
  }

  // If no ID, show list of manuscripts that need reviewers
  if (!searchParams.id) {
    const submissions = await prisma.submission.findMany({
      where: { 
        status: { in: ["INITIAL_SCREENING", "UNDER_REVIEW", "REVISION_SUBMITTED"] } 
      },
      orderBy: { updatedAt: "desc" },
      include: { author: { select: { name: true } } }
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Reviewer Assignment</h1>
          <p className="text-slate-500">Select a manuscript to assign or manage reviewers.</p>
        </div>
        <SubmissionsTable submissions={submissions} emptyMessage="No manuscripts need reviewers at this time." />
      </div>
    );
  }

  // If ID provided, show the assignment interface
  const submission = await prisma.submission.findUnique({
    where: { id: searchParams.id },
    include: {
      reviewerAssignments: {
        include: { reviewer: true }
      }
    }
  });

  if (!submission) return notFound();

  // Fetch users with REVIEWER role
  const reviewers = await prisma.user.findMany({
    where: {
      roles: {
        some: { role: "REVIEWER" }
      },
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/editor/submissions/assign-reviewers" className="text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assign Reviewers</h1>
          <p className="text-slate-500">{submission.submissionId} - {submission.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Current Assignments</h3>
          {submission.reviewerAssignments.length > 0 ? (
            <ul className="space-y-3">
              {submission.reviewerAssignments.map(assignment => (
                <li key={assignment.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{assignment.reviewer.name}</p>
                    <p className="text-xs text-slate-500">{assignment.reviewer.email}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-md">
                    {assignment.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No reviewers assigned yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Available Reviewers</h3>
          <AssignReviewerClient 
            submissionId={submission.id} 
            availableReviewers={reviewers} 
            currentAssignments={
              submission.reviewerAssignments
                .filter(a => {
                  if (a.status === "INVITED" || a.status === "ACCEPTED") return true;
                  if (a.status === "SUBMITTED" && submission.status !== "REVISION_SUBMITTED") return true;
                  return false;
                })
                .map(a => a.reviewerId)
            }
          />
        </div>
      </div>
    </div>
  );
}

