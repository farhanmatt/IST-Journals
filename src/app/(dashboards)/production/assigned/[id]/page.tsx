export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Download, FileText, ArrowLeft, Calendar, User, BookOpen, AlertCircle, Clock, CheckCircle2, Layers, Code2 } from "lucide-react";
import { ProductionActionsClient } from "./ProductionActionsClient";
import { formatDateTime } from "@/lib/date";

export default async function ProductionManuscriptWorkspacePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const userId = session.user.id;
  const isAdmin = session.user.roles.includes("ADMIN");

  // Fetch assignment for this production editor
  const assignment = await prisma.productionAssignment.findUnique({
    where: {
      submissionId_productionEditorId: {
        submissionId: params.id,
        productionEditorId: userId,
      },
    },
  });

  // Strict user-isolation: only the assigned production editor or admin can access
  if (!assignment && !isAdmin) {
    redirect("/production/dashboard");
  }

  // Fetch manuscript details with file uploader information
  const [submission, availableIssues] = await Promise.all([
    prisma.submission.findUnique({
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
        copyeditorAssignments: {
          select: {
            id: true,
            status: true,
            notes: true,
            completedAt: true,
            copyeditor: { select: { name: true, email: true } },
          },
        },
      },
    }),
    prisma.issue.findMany({
      orderBy: [{ year: "desc" }, { volume: "desc" }, { issueNumber: "desc" }],
      select: {
        id: true,
        volume: true,
        issueNumber: true,
        year: true,
        status: true,
      },
    })
  ]);

  if (!submission) return notFound();

  // Journal info
  const journalSetting = await prisma.journalSetting.findFirst({
    where: { key: "journalName" },
  }).catch(() => null);
  const journalName = journalSetting?.value || "IST Journals";

  const copyeditedFiles = submission.files.filter(f => f.type === "COPYEDITED_FILE");
  const productionFiles = submission.files.filter(f => 
    f.type === "PRODUCTION_READY_PDF" || 
    f.type === "PRODUCTION_READY_HTML" ||
    (f.type === "SUPPLEMENTARY" && f.uploaderId === userId)
  );
  const originalFiles = submission.files.filter(f => 
    f.type !== "COPYEDITED_FILE" && 
    f.type !== "PRODUCTION_READY_PDF" && 
    f.type !== "PRODUCTION_READY_HTML" &&
    !(f.type === "SUPPLEMENTARY" && f.uploaderId === userId)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center space-x-4 mb-2">
        <Link 
          href="/production/assigned" 
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
                submission.status === "PUBLISHED"
                  ? "bg-emerald-100 text-emerald-800"
                  : submission.status === "PENDING_FINAL_APPROVAL"
                  ? "bg-indigo-100 text-indigo-800"
                  : submission.status === "PRODUCTION_CORRECTIONS_REQUIRED"
                  ? "bg-amber-100 text-amber-800"
                  : assignment?.status === "COMPLETED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {submission.status.replace(/_/g, " ")}
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
                Editor Instructions / Production Scope
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

          {/* Copyedited Files Section (Source files for production) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Copyedited Source Files
                </h3>
                <p className="text-xs text-slate-500">
                  Clean copyedited manuscripts from the copyediting team to use for typesetting.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                {copyeditedFiles.length} file(s)
              </span>
            </div>

            {copyeditedFiles.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {copyeditedFiles.map((file) => (
                  <div key={file.id} className="p-3.5 flex items-center justify-between bg-emerald-50/20 hover:bg-emerald-50/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {file.originalName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{(file.size / 1024).toFixed(0)} KB</span>
                          <span>&bull;</span>
                          <span>v{file.version}</span>
                          <span>&bull;</span>
                          <span>Uploaded: {formatDateTime(file.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Copyedited</span>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 text-center italic">
                No copyedited files recorded. Check original manuscript files below.
              </div>
            )}
          </div>

          {/* Original Manuscript Files (Figures, tables, author uploads) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  Original Submission Files & Figures
                </h3>
                <p className="text-xs text-slate-500">
                  Original author manuscripts, supplementary data, tables, and figures.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {originalFiles.length} file(s)
              </span>
            </div>

            {originalFiles.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {originalFiles.map((file) => (
                  <div key={file.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {file.originalName}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {file.type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {(file.size / 1024).toFixed(0)} KB &bull; Uploaded {formatDateTime(file.createdAt)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors shrink-0"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No additional files uploaded.</p>
            )}
          </div>

          {/* Interactive Production Workspace Client */}
          <ProductionActionsClient
            submissionId={submission.id}
            assignmentStatus={assignment?.status || "ASSIGNED"}
            submissionStatus={submission.status}
            existingChecklist={assignment?.checklist as any}
            existingNotes={assignment?.notes}
            existingMetadata={assignment?.metadata as any}
            dueDate={assignment?.dueDate ? assignment.dueDate.toISOString() : null}
            completedAt={assignment?.completedAt ? assignment.completedAt.toISOString() : null}
            productionFiles={productionFiles}
            availableIssues={availableIssues}
          />
        </div>

        {/* Sidebar Information (1 Col) */}
        <div className="space-y-6">
          {/* Status Overview Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Production Status
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Status</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full ${
                  assignment?.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-800"
                    : assignment?.status === "IN_PROGRESS"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {assignment?.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Assigned Date</span>
                <span className="font-medium text-slate-700">
                  {assignment?.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Due Date</span>
                <span className={`font-medium ${
                  assignment?.dueDate && new Date(assignment.dueDate) < new Date() && assignment.status !== "COMPLETED"
                    ? "text-rose-600 font-semibold"
                    : "text-slate-700"
                }`}>
                  {assignment?.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No deadline"}
                </span>
              </div>

              {assignment?.completedAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Completed Date</span>
                  <span className="font-semibold text-emerald-600">
                    {new Date(assignment.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submission Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Manuscript Details
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Section</span>
                <span className="font-medium text-slate-700">{submission.section?.name || "General"}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Primary Author</span>
                <span className="font-medium text-slate-800 block">{submission.author?.name || "Unknown"}</span>
                <span className="text-slate-500">{submission.author?.email}</span>
              </div>

              {submission.coAuthors && submission.coAuthors.length > 0 && (
                <div>
                  <span className="text-slate-400 block mb-1">Co-Authors ({submission.coAuthors.length})</span>
                  <div className="space-y-1">
                    {submission.coAuthors.map((ca) => (
                      <div key={ca.id} className="text-slate-700">
                        {ca.firstName} {ca.lastName} <span className="text-slate-400">({ca.affiliation})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editorial Pipeline Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Editorial Pipeline
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Peer Review Accepted</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Copyediting Finished</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Production & Typesetting</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Issue Publication</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
