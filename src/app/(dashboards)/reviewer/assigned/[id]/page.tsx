export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { Download, FileText, CheckCircle2, BookOpen } from "lucide-react";
import { SubmitReviewClient } from "./SubmitReviewClient";
import { BackButton } from "../../components/BackButton";
import { formatDateTime } from "@/lib/date";

export default async function ReviewWorkspacePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      files: {
        orderBy: [{ version: "desc" }, { createdAt: "desc" }]
      },
      revisions: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!submission) return notFound();

  const assignment = await prisma.reviewerAssignment.findFirst({
    where: { submissionId: params.id, reviewerId: session.user.id },
    orderBy: { createdAt: "desc" }
  });

  if (!assignment) return notFound();
  
  if (assignment.status === "SUBMITTED") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4 mb-2">
          <BackButton />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Review Submitted</h1>
        </div>
        <div className="bg-emerald-50/80 text-emerald-900 p-6 sm:p-8 rounded-2xl border border-emerald-200/80 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-base text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Thank you for completing this peer review!</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
            Your review evaluation for <strong>&quot;{submission.title}&quot;</strong> has been recorded and delivered to the editorial board.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              Recommendation: {assignment.recommendation?.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (assignment.status !== "ACCEPTED") {
    redirect("/reviewer/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <BackButton />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Review Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">Evaluate the manuscript and submit your review report.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                  Assigned Manuscript
                </span>
                <span className="text-xs font-mono text-slate-500">ID: {submission.submissionId}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{submission.title || "Untitled"}</h2>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200/60">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Abstract</h3>
            <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{submission.abstract || "No abstract provided."}</p>
          </div>

          {submission.revisions.length > 0 && submission.revisions[0].responseToReviewers && (
            <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Author Response to Reviewers (Revision v{submission.revisions[0].versionNumber})</span>
              </h3>
              <p className="text-xs sm:text-sm text-amber-950 whitespace-pre-wrap leading-relaxed">{submission.revisions[0].responseToReviewers}</p>
            </div>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Manuscript Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {submission.files.map(f => (
              <a 
                key={f.id} 
                href={f.url} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center p-3.5 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/20 transition-all group shadow-2xs"
              >
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{f.originalName}</p>
                    {f.version > 1 && (
                      <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                        v{f.version} (Revised)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{f.type} • {(f.size / 1024).toFixed(1)} KB • {formatDateTime(f.createdAt)}</p>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 ml-2 shrink-0 transition-colors" />
              </a>
            ))}
            {submission.files.length === 0 && <p className="text-xs text-slate-500 col-span-2">No files available.</p>}
          </div>
        </div>
      </div>

      <SubmitReviewClient assignmentId={assignment.id} />
    </div>
  );
}
