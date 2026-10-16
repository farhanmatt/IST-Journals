export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { Download, FileText, Check, X, AlertCircle } from "lucide-react";
import { EditorActionsClient } from "./EditorActionsClient";
import { BackButton } from "../../components/BackButton";
import { formatDateTime } from "@/lib/date";

export default async function SubmissionDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  // Bypass cache with queryRaw or findUnique if findUnique works. We will try findUnique first.
  const [submission, availableCopyeditors, availableProductionEditors, availableIssues, availableReviewers] = await Promise.all([
    prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        author: true,
        section: true,
        files: true,
        coAuthors: true,
        reviewerAssignments: {
          include: { reviewer: true },
          orderBy: { createdAt: "desc" }
        },
        decisions: {
          include: { editor: true },
          orderBy: { createdAt: "desc" }
        },
        revisions: {
          orderBy: { versionNumber: "desc" }
        },
        copyeditorAssignments: {
          include: { copyeditor: true }
        },
        productionAssignments: {
          include: { productionEditor: true }
        },
        publishedArticle: {
          include: { issue: true }
        }
      }
    }),
    prisma.user.findMany({
      where: {
        roles: {
          some: { role: "COPYEDITOR" }
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    }),
    prisma.user.findMany({
      where: {
        roles: {
          some: { role: "PRODUCTION_EDITOR" }
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    }),
    prisma.issue.findMany({
      orderBy: [{ year: "desc" }, { volume: "desc" }, { issueNumber: "desc" }],
      select: {
        id: true,
        volume: true,
        issueNumber: true,
        year: true,
        status: true,
        description: true
      }
    }),
    prisma.user.findMany({
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
    })
  ]);

  if (!submission) return notFound();

  // Auto-synchronize to REVIEWS_COMPLETED or REJECTED if all reviews are submitted
  if (
    submission.status === "UNDER_REVIEW" &&
    submission.reviewerAssignments.length > 0 &&
    submission.reviewerAssignments.some(r => r.status === "SUBMITTED") &&
    !submission.reviewerAssignments.some(r => r.status === "INVITED" || r.status === "ACCEPTED")
  ) {
    const latestSubmitted = [...submission.reviewerAssignments]
      .filter(r => r.status === "SUBMITTED")
      .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())[0];
    const targetStatus = latestSubmitted?.recommendation === "REJECT" ? "REJECTED" : "REVIEWS_COMPLETED";

    try {
      await prisma.submission.update({
        where: { id: submission.id },
        data: { status: targetStatus, updatedAt: new Date() }
      });
      submission.status = targetStatus;
    } catch (e) {
      console.warn("Status sync notice on detail page:", e);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start gap-4 mb-2">
        <BackButton />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 break-words">{submission.title || "Untitled"}</h1>
            <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
              submission.status === "REJECTED" || submission.status === "DESK_REJECTED"
                ? "bg-red-100 text-red-800"
                : submission.status === "ACCEPTED" || submission.status === "PUBLISHED"
                ? "bg-emerald-100 text-emerald-800"
                : submission.status === "REVISION_REQUIRED"
                ? "bg-amber-100 text-amber-800"
                : "bg-blue-100 text-blue-800"
            }`}>
              {submission.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            ID: <span className="font-mono font-medium text-slate-700">{submission.submissionId}</span> • Submitted on {formatDateTime(submission.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Abstract</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{submission.abstract || "No abstract provided."}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Keywords</h3>
                <p className="text-slate-700">{submission.keywords || "None"}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Section</h3>
                <p className="text-slate-700">{submission.section?.name || "Unassigned"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Manuscript & Workflow Files</h3>
              <div className="flex items-center gap-2">
                {submission.files.some(f => f.type === "PRODUCTION_READY_PDF") && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    PDF Proof Ready
                  </span>
                )}
                {submission.files.some(f => f.type === "COPYEDITED_FILE") && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Copyedited File Available
                  </span>
                )}
              </div>
            </div>
            {submission.files.length > 0 ? (
              <ul className="space-y-3">
                {submission.files.map(file => {
                  const isPdfProof = file.type === "PRODUCTION_READY_PDF";
                  const isHtmlProof = file.type === "PRODUCTION_READY_HTML";
                  const isCopyedited = file.type === "COPYEDITED_FILE";

                  return (
                    <li 
                      key={file.id} 
                      className={`flex items-center justify-between p-3.5 rounded-lg border transition-colors ${
                        isPdfProof
                          ? "bg-red-50/60 border-red-200"
                          : isHtmlProof
                          ? "bg-blue-50/60 border-blue-200"
                          : isCopyedited 
                          ? "bg-emerald-50/70 border-emerald-200" 
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1 mr-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isPdfProof
                            ? "bg-red-100 text-red-600"
                            : isHtmlProof
                            ? "bg-blue-100 text-blue-600"
                            : isCopyedited 
                            ? "bg-emerald-100 text-emerald-600" 
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-900 break-all">{file.originalName}</p>
                            {file.version > 1 && (
                              <span className="shrink-0 px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded uppercase tracking-wider">
                                v{file.version} (Revised)
                              </span>
                            )}
                            {file.version === 1 && file.type === "MANUSCRIPT" && (
                              <span className="shrink-0 px-2 py-0.5 bg-slate-100 text-slate-700 font-medium text-[10px] rounded uppercase tracking-wider">
                                v1 Original
                              </span>
                            )}
                            {isPdfProof && (
                              <span className="shrink-0 px-2 py-0.5 bg-red-200 text-red-900 font-bold text-[10px] rounded uppercase tracking-wider">
                                Final PDF Proof
                              </span>
                            )}
                            {isHtmlProof && (
                              <span className="shrink-0 px-2 py-0.5 bg-blue-200 text-blue-900 font-bold text-[10px] rounded uppercase tracking-wider">
                                Web Galley HTML
                              </span>
                            )}
                            {isCopyedited && (
                              <span className="shrink-0 px-2 py-0.5 bg-emerald-200/80 text-emerald-900 font-bold text-[10px] rounded uppercase tracking-wider">
                                Copyedited
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {file.type.replace(/_/g, " ")} • {(file.size / 1024).toFixed(1)} KB • Uploaded on {formatDateTime(file.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {file.originalName.toLowerCase().endsWith(".pdf") && (
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-semibold transition-colors"
                            title="Preview PDF proof in browser"
                          >
                            Preview
                          </a>
                        )}
                        <a 
                          href={file.url} 
                          download 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No files uploaded.</p>
            )}
          </div>
          
          {/* Peer Review Reports */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Peer Review Reports ({submission.reviewerAssignments.filter(r => r.status === "SUBMITTED").length} Completed)
              </h3>
            </div>

            {submission.reviewerAssignments.length > 0 ? (
              <div className="space-y-4">
                {submission.reviewerAssignments.map((rev) => (
                  <div key={rev.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                      <div>
                        <span className="font-semibold text-slate-900 text-base">{rev.reviewer.name}</span>
                        <span className="text-xs text-slate-500 ml-2">({rev.reviewer.email})</span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {rev.submittedAt 
                            ? `Submitted on ${new Date(rev.submittedAt).toLocaleDateString()}` 
                            : `Assigned • Due: ${rev.dueDate ? new Date(rev.dueDate).toLocaleDateString() : "No deadline"}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                          rev.status === "SUBMITTED" 
                            ? "bg-emerald-100 text-emerald-800" 
                            : rev.status === "ACCEPTED" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {rev.status.replace(/_/g, ' ')}
                        </span>
                        {rev.recommendation && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                            rev.recommendation === "ACCEPT" 
                              ? "bg-green-100 text-green-800" 
                              : rev.recommendation === "REJECT" 
                              ? "bg-red-100 text-red-800" 
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {rev.recommendation.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {rev.status === "SUBMITTED" ? (
                      <div className="space-y-4 pt-1">
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Comments for the Author
                          </h4>
                          <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap">
                            {rev.commentsForAuthor || <span className="italic text-slate-400">No comments provided for author.</span>}
                          </div>
                        </div>

                        {rev.commentsForEditor && (
                          <div>
                            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center">
                              <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
                              Confidential Comments for Editor (Hidden from Author)
                            </h4>
                            <div className="bg-amber-50/70 p-4 rounded-lg border border-amber-200 text-sm text-amber-950 whitespace-pre-wrap">
                              {rev.commentsForEditor}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Review in progress. Report will appear once submitted.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No reviewers assigned yet.</p>
            )}
          </div>
          
          {/* Author Revision History & Rebuttals */}
          {submission.revisions && submission.revisions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Author Revision History & Rebuttals ({submission.revisions.length})
                </h3>
              </div>
              <div className="space-y-4">
                {submission.revisions.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-900 text-sm">
                        Revision Version {rev.versionNumber} Rebuttal
                      </span>
                      <span className="text-xs text-slate-500">
                        Submitted on {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Response to Reviewer & Editor Comments
                      </h4>
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap">
                        {rev.responseToReviewers || <span className="italic text-slate-400">No written rebuttal provided.</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {submission.decisions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Decision History</h3>
              <div className="space-y-4">
                {submission.decisions.map(dec => (
                  <div key={dec.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-900">{dec.decision.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-slate-500">{dec.createdAt.toLocaleDateString()}</span>
                    </div>
                    {dec.commentsForAuthor && (
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-slate-500">Comments to Author:</span>
                        <p className="text-sm text-slate-700 mt-1">{dec.commentsForAuthor}</p>
                      </div>
                    )}
                    {dec.internalComments && (
                      <div>
                        <span className="text-xs font-semibold text-slate-500">Internal Comments:</span>
                        <p className="text-sm text-slate-700 mt-1 bg-amber-50 p-2 rounded">{dec.internalComments}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Actions & Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Authors</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{submission.author.name} (Corresponding)</p>
                <p className="text-xs text-slate-500">{submission.author.email}</p>
              </div>
              {submission.coAuthors.map(co => (
                <div key={co.id}>
                  <p className="text-sm font-medium text-slate-900">{co.firstName} {co.lastName}</p>
                  <p className="text-xs text-slate-500">{co.affiliation}</p>
                </div>
              ))}
            </div>
          </div>

          <EditorActionsClient 
            submissionId={submission.id} 
            status={submission.status} 
            reviewers={submission.reviewerAssignments}
            availableReviewers={availableReviewers}
            copyeditors={availableCopyeditors}
            copyeditorAssignments={submission.copyeditorAssignments}
            productionEditors={availableProductionEditors}
            productionAssignments={submission.productionAssignments}
            availableIssues={availableIssues}
            publishedArticle={submission.publishedArticle}
            files={submission.files}
            decisions={submission.decisions}
            revisions={submission.revisions}
          />
        </div>
      </div>
    </div>
  );
}
