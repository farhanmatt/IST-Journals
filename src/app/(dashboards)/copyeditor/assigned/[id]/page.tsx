export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Download, FileText, ArrowLeft, Calendar, User, BookOpen, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { CopyEditorActionsClient } from "./CopyEditorActionsClient";
import { formatDateTime } from "@/lib/date";

export default async function CopyEditorManuscriptWorkspacePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const userId = session.user.id;
  const isAdmin = session.user.roles.includes("ADMIN");

  // Fetch assignment for this copyeditor
  const assignment = await prisma.copyeditorAssignment.findUnique({
    where: {
      submissionId_copyeditorId: {
        submissionId: params.id,
        copyeditorId: userId,
      },
    },
  });

  // Strict user-isolation: only the assigned copyeditor or admin can access
  if (!assignment && !isAdmin) {
    redirect("/copyeditor/dashboard");
  }

  // Fetch manuscript details with file uploader information
  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      section: { select: { id: true, name: true } },
      files: {
        include: {
          uploader: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ version: "desc" }, { createdAt: "desc" }],
      },
      coAuthors: true,
      reviewerAssignments: {
        where: { status: "SUBMITTED" },
        select: {
          id: true,
          recommendation: true,
          commentsForAuthor: true, // Only author comments, never confidential editor comments
          submittedAt: true,
        },
      },
    },
  });

  if (!submission) return notFound();

  // Journal info
  const journalSetting = await prisma.journalSetting.findFirst({
    where: { key: "journalName" },
  }).catch(() => null);
  const journalName = journalSetting?.value || "IST Journals";

  const originalFiles = submission.files.filter(f => f.type !== "COPYEDITED_FILE");
  const copyeditedFiles = submission.files.filter(f => f.type === "COPYEDITED_FILE");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center space-x-4 mb-2">
        <Link 
          href="/copyeditor/assigned" 
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 truncate">
              {submission.title || "Untitled Manuscript"}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                assignment?.status === "COMPLETED"
                  ? "bg-emerald-100 text-emerald-800"
                  : assignment?.status === "IN_PROGRESS"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {assignment?.status === "COMPLETED" ? "Completed Copyediting" : assignment?.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Manuscript ID: <span className="font-mono font-semibold text-slate-700">{submission.submissionId}</span> • 
            Journal: <span className="font-medium text-slate-700">{journalName}</span> • 
            Submitted: {new Date(submission.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Editor's Instructions / Notes if any */}
          {assignment?.notes && (
            <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-5 space-y-2">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Editor Instructions / Notes
              </h3>
              <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
                {assignment.notes}
              </p>
              {assignment.dueDate && (
                <p className="text-xs text-amber-700 font-semibold pt-1 border-t border-amber-200/60">
                  Target Due Date: {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Manuscript Metadata */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Abstract
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {submission.abstract || "No abstract provided."}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Keywords
                </h3>
                <p className="text-sm text-slate-800">{submission.keywords || "None provided"}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Section
                </h3>
                <p className="text-sm text-slate-800">{submission.section?.name || "General"}</p>
              </div>
            </div>
          </div>

          {/* Original Manuscript Files */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Original Manuscript Files ({originalFiles.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Download the author&apos;s submission to perform language and styling edits.
                </p>
              </div>
            </div>

            {originalFiles.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {originalFiles.map((file) => (
                  <li key={file.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">{file.originalName}</p>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded">
                            v{file.version}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {file.type} • {(file.size / 1024).toFixed(1)} KB • Uploaded on {formatDateTime(file.createdAt)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      download
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0 ml-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Original</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">No original manuscript files uploaded.</p>
            )}
          </div>

          {/* Copyedited Files Section with Version and Copyeditor Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Copyedited Manuscript Versions ({copyeditedFiles.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revised files uploaded for this manuscript with full version history.
                </p>
              </div>
              {copyeditedFiles.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {assignment?.status === "COMPLETED" ? "Submitted to Editor" : "Draft in Progress"}
                </span>
              )}
            </div>

            {copyeditedFiles.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {copyeditedFiles.map((file) => (
                  <li key={file.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">{file.originalName}</p>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                            v{file.version}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Uploaded by: <span className="font-medium text-slate-700">{file.uploader?.name || file.uploader?.email || "Copyeditor"}</span> • 
                          {(file.size / 1024).toFixed(1)} KB • 
                          Uploaded on {formatDateTime(file.createdAt)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      download
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-medium text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/50 transition-colors shrink-0 ml-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No copyedited files uploaded yet. Download the original manuscript, apply language & formatting corrections, and upload the edited file using the workspace panel.
              </p>
            )}
          </div>

          {/* Author Feedback from Peer Review (Confidential Comments Excluded) */}
          {submission.reviewerAssignments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Peer Review Feedback for Author
              </h3>
              <div className="space-y-3">
                {submission.reviewerAssignments.map((rev, idx) => (
                  <div key={rev.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Reviewer #{idx + 1}</span>
                      {rev.recommendation && (
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                          {rev.recommendation.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {rev.commentsForAuthor || "No comments recorded."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Authors Info & Interactive Copyediting Workspace */}
        <div className="space-y-6">
          {/* Author Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              Author Information
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-slate-900">{submission.author?.name || "Unknown Author"}</p>
                <p className="text-slate-500">{submission.author?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded text-[10px]">
                  Corresponding Author
                </span>
              </div>

              {submission.coAuthors.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="font-bold text-slate-500 uppercase text-[10px]">Co-Authors ({submission.coAuthors.length})</p>
                  {submission.coAuthors.map((co) => (
                    <div key={co.id} className="text-slate-700">
                      <p className="font-medium text-slate-800">{co.firstName} {co.lastName}</p>
                      <p className="text-slate-400 text-[11px]">{co.affiliation || co.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Copyediting Checklist & Actions Component */}
          <CopyEditorActionsClient
            submissionId={submission.id}
            assignmentStatus={assignment?.status || "ASSIGNED"}
            existingChecklist={assignment?.checklist as any}
            existingNotes={assignment?.notes}
            dueDate={assignment?.dueDate ? assignment.dueDate.toISOString() : null}
            completedAt={assignment?.completedAt ? assignment.completedAt.toISOString() : null}
            existingCopyeditedFiles={copyeditedFiles}
          />
        </div>
      </div>
    </div>
  );
}
