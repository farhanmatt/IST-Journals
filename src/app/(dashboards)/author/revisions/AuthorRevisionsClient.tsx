"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Download, Upload, CheckCircle2, 
  AlertCircle, Clock, Send, ChevronDown, ChevronUp, 
  FileCheck, RotateCcw, AlertTriangle, ArrowRight, Loader2, Sparkles 
} from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { submitAuthorRevision } from "./actions";

interface AuthorRevisionsClientProps {
  submissions: any[];
  initialSelectedId?: string;
}

export function AuthorRevisionsClient({ submissions, initialSelectedId }: AuthorRevisionsClientProps) {
  const router = useRouter();
  const confirm = useConfirm();

  const pendingRevisions = submissions.filter(s => s.status === "REVISION_REQUIRED");
  const submittedRevisions = submissions.filter(s => s.status === "REVISION_SUBMITTED");

  const [activeTab, setActiveTab] = useState<"pending" | "submitted">(
    pendingRevisions.length > 0 || !submittedRevisions.length ? "pending" : "submitted"
  );

  const [expandedId, setExpandedId] = useState<string | null>(
    initialSelectedId || (pendingRevisions[0]?.id || submittedRevisions[0]?.id || null)
  );

  // Form states per submission
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { fileId: string; name: string; url: string }>>({});
  const [rebuttalNotes, setRebuttalNotes] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [successMessages, setSuccessMessages] = useState<Record<string, string>>({});

  const handleFileUpload = async (submissionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessages(prev => ({ ...prev, [submissionId]: "" }));
    setUploading(prev => ({ ...prev, [submissionId]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("submissionId", submissionId);
      formData.append("type", "MANUSCRIPT");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to upload file");
      }

      setUploadedFiles(prev => ({
        ...prev,
        [submissionId]: {
          fileId: data.fileId,
          name: file.name,
          url: data.url
        }
      }));
    } catch (err: any) {
      setErrorMessages(prev => ({ ...prev, [submissionId]: err.message || "Upload failed." }));
    } finally {
      setUploading(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  const handleSubmitRevision = async (submissionId: string, submissionTitle: string) => {
    setErrorMessages(prev => ({ ...prev, [submissionId]: "" }));
    setSuccessMessages(prev => ({ ...prev, [submissionId]: "" }));

    const uploaded = uploadedFiles[submissionId];
    if (!uploaded) {
      setErrorMessages(prev => ({ ...prev, [submissionId]: "Please upload your revised manuscript file before submitting." }));
      return;
    }

    const rebuttal = (rebuttalNotes[submissionId] || "").trim();
    if (!rebuttal) {
      setErrorMessages(prev => ({ ...prev, [submissionId]: "Please provide a response/rebuttal to the reviewer and editor comments." }));
      return;
    }

    const confirmed = await confirm({
      title: "Submit Revised Manuscript",
      message: (
        <div className="space-y-2">
          <p>Are you sure you want to submit your revised manuscript for <strong>"{submissionTitle}"</strong>?</p>
          <p className="text-xs text-slate-500">
            This will upload revision file <strong>{uploaded.name}</strong> and deliver your rebuttal to the editorial team.
          </p>
        </div>
      ),
      confirmText: "Submit Revision",
      cancelText: "Cancel",
      variant: "info",
    });

    if (!confirmed) return;

    setSubmitting(prev => ({ ...prev, [submissionId]: true }));
    const res = await submitAuthorRevision(submissionId, {
      responseToReviewers: rebuttal
    });
    setSubmitting(prev => ({ ...prev, [submissionId]: false }));

    if (res?.success) {
      setSuccessMessages(prev => ({
        ...prev,
        [submissionId]: "Revised manuscript submitted successfully! The editorial office has been notified."
      }));
      router.refresh();
    } else {
      setErrorMessages(prev => ({
        ...prev,
        [submissionId]: res?.error || "Failed to submit revision."
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Manuscript Revisions</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Review editorial feedback, download current files, and submit revised manuscripts.
          </p>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex border-b border-slate-200/80 gap-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === "pending"
              ? "border-amber-600 text-amber-800"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Revisions Requested</span>
          {pendingRevisions.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
              {pendingRevisions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("submitted")}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === "submitted"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Submitted Revisions (Under Review)</span>
          {submittedRevisions.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-bold">
              {submittedRevisions.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content: Pending Revisions */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingRevisions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-12 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No Revisions Pending</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                None of your manuscripts currently require revisions. You will be notified here if an editor requests corrections.
              </p>
            </div>
          ) : (
            pendingRevisions.map((sub) => {
              const isExpanded = expandedId === sub.id;
              const latestDecision = sub.decisions?.[0];
              const isMajor = latestDecision?.decision === "MAJOR_REVISION";
              const manuscriptFiles = (sub.files || []).filter((f: any) => f.type === "MANUSCRIPT");
              const latestFile = manuscriptFiles.sort((a: any, b: any) => (b.version || 1) - (a.version || 1))[0];
              const completedReviews = (sub.reviewerAssignments || []).filter((r: any) => r.status === "SUBMITTED" && r.commentsForAuthor);

              return (
                <div 
                  key={sub.id} 
                  className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all duration-200"
                >
                  {/* Header Row */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                    className="p-5 sm:p-6 cursor-pointer hover:bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isMajor ? "bg-orange-100 text-orange-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {isMajor ? "Major Revision Required" : "Minor Revision Required"}
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-500">ID: {sub.submissionId}</span>
                        <span className="text-xs text-slate-400">
                          • Requested on {latestDecision ? new Date(latestDecision.createdAt).toLocaleDateString() : new Date(sub.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{sub.title || "Untitled Manuscript"}</h2>
                      <p className="text-xs text-slate-500">Section: {sub.section?.name || "General"} • Version: {latestFile ? `v${latestFile.version}` : "v1"}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button 
                        type="button"
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-amber-600/20 transition-colors flex items-center gap-1.5"
                      >
                        <span>{isExpanded ? "Collapse" : "Prepare Revision"}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 space-y-6 bg-slate-50/40">
                      {/* Success / Error Alerts */}
                      {successMessages[sub.id] && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in duration-200">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>{successMessages[sub.id]}</span>
                        </div>
                      )}
                      {errorMessages[sub.id] && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in duration-200">
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                          <span>{errorMessages[sub.id]}</span>
                        </div>
                      )}

                      {/* 1. Editor Instructions */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                            ED
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              Editor Revision Instructions
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              {latestDecision?.editor?.name ? `From Editor: ${latestDecision.editor.name}` : "From Editorial Team"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {latestDecision?.commentsForAuthor || (
                            <span className="italic text-slate-400">Please revise the manuscript in accordance with reviewer comments.</span>
                          )}
                        </div>
                      </div>

                      {/* 2. Reviewer Feedback (Author-facing comments only) */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Reviewer Reports & Comments ({completedReviews.length})
                        </h3>

                        {completedReviews.length > 0 ? (
                          <div className="space-y-3.5">
                            {completedReviews.map((rev: any, idx: number) => (
                              <div key={rev.id || idx} className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-2">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                                  <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                                    Reviewer {idx + 1}
                                  </span>
                                  {rev.recommendation && (
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                      Recommendation: {rev.recommendation.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                                  {rev.commentsForAuthor}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No direct reviewer comments attached. Please follow the editor's instructions above.</p>
                        )}
                      </div>

                      {/* 3. Current Manuscript Download */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Current Manuscript Files
                        </h3>
                        <div className="space-y-2">
                          {manuscriptFiles.map((file: any) => (
                            <div key={file.id} className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-200">
                              <div className="flex items-center space-x-3 min-w-0 flex-1 mr-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-xs sm:text-sm font-semibold text-slate-900 break-all">{file.originalName}</p>
                                    <span className="shrink-0 px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                                      v{file.version}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {(file.size / 1024).toFixed(1)} KB • Uploaded {new Date(file.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <a 
                                href={file.url} 
                                download 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 4. Submission Form for Revised Manuscript */}
                      <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 sm:p-6 space-y-5 shadow-sm">
                        <div className="border-b border-slate-200/70 pb-3">
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-amber-600" />
                            Submit Revised Manuscript & Rebuttal
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Upload your revised manuscript document and provide detailed responses to the comments raised.
                          </p>
                        </div>

                        {/* File Upload Area */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            1. Upload Revised Manuscript Document (.pdf, .docx) *
                          </label>

                          <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                            <input 
                              type="file" 
                              id={`file-upload-${sub.id}`}
                              onChange={(e) => handleFileUpload(sub.id, e)}
                              disabled={uploading[sub.id]}
                              accept=".pdf,.doc,.docx"
                              className="hidden"
                            />
                            
                            {uploadedFiles[sub.id] ? (
                              <div className="flex items-center justify-center gap-3 text-emerald-700">
                                <FileCheck className="w-6 h-6 text-emerald-600" />
                                <div className="text-left">
                                  <p className="font-semibold text-sm">{uploadedFiles[sub.id].name}</p>
                                  <p className="text-xs text-emerald-600">File uploaded and ready for submission.</p>
                                </div>
                                <label 
                                  htmlFor={`file-upload-${sub.id}`}
                                  className="ml-4 text-xs font-semibold text-slate-600 hover:text-amber-700 underline cursor-pointer"
                                >
                                  Replace File
                                </label>
                              </div>
                            ) : uploading[sub.id] ? (
                              <div className="flex flex-col items-center justify-center space-y-2 text-slate-600">
                                <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-semibold">Uploading manuscript file...</span>
                              </div>
                            ) : (
                              <label htmlFor={`file-upload-${sub.id}`} className="cursor-pointer flex flex-col items-center space-y-2">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                  <Upload className="w-5 h-5" />
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-amber-700 hover:underline">Click to browse</span>
                                  <span className="text-sm text-slate-500"> or drag and drop your revised file</span>
                                </div>
                                <p className="text-[11px] text-slate-400">PDF, DOC, DOCX up to 50MB</p>
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Point-by-point Rebuttal Notes */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            2. Point-by-Point Response to Reviewers & Editor (Rebuttal Notes) *
                          </label>
                          <textarea 
                            rows={6}
                            value={rebuttalNotes[sub.id] || ""}
                            onChange={(e) => setRebuttalNotes(prev => ({ ...prev, [sub.id]: e.target.value }))}
                            placeholder="Dear Editor and Reviewers,&#10;&#10;Thank you for your constructive comments. Below is our point-by-point response detailing all modifications made in this revised manuscript:&#10;&#10;Reviewer 1, Comment 1: [Address comment here]&#10;Response: [Explain changes made]..."
                            className="w-full p-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white outline-none leading-relaxed"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">
                            A clear and structured rebuttal accelerates the re-evaluation and final editorial decision.
                          </p>
                        </div>

                        {/* Submit Action Button */}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSubmitRevision(sub.id, sub.title)}
                            disabled={submitting[sub.id] || uploading[sub.id]}
                            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-sm shadow-amber-600/20 text-xs sm:text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {submitting[sub.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Submitting Revision...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Submit Revised Manuscript</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content: Submitted Revisions */}
      {activeTab === "submitted" && (
        <div className="space-y-4">
          {submittedRevisions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-12 text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No Revisions Currently Under Review</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                When you submit a revision, it will appear here while the editorial office and reviewers evaluate your updated manuscript.
              </p>
            </div>
          ) : (
            submittedRevisions.map((sub) => {
              const latestRevision = sub.revisions?.[0];
              const manuscriptFiles = (sub.files || []).filter((f: any) => f.type === "MANUSCRIPT");
              const latestFile = manuscriptFiles.sort((a: any, b: any) => (b.version || 1) - (a.version || 1))[0];

              return (
                <div key={sub.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                          Revision Submitted • Under Evaluation
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-500">ID: {sub.submissionId}</span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">{sub.title || "Untitled Manuscript"}</h2>
                    </div>
                    <span className="text-xs text-slate-500">
                      Updated {new Date(sub.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Status: Under Editorial Evaluation / Re-Review
                    </p>
                    <p className="leading-relaxed">
                      Your revised manuscript (Version {latestRevision?.versionNumber || latestFile?.version || 2}) has been received by the editorial office. The editor is currently evaluating the revisions and may conduct a follow-up review round before issuing a final decision.
                    </p>
                  </div>

                  {/* Submitted Files */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Submitted Files</h4>
                    <div className="space-y-2">
                      {manuscriptFiles.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-100 text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                            <span className="font-semibold text-slate-900 truncate">{f.originalName}</span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">v{f.version}</span>
                          </div>
                          <a 
                            href={f.url} 
                            download 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline shrink-0 font-medium"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Author Rebuttal Summary */}
                  {latestRevision?.responseToReviewers && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Your Response to Reviewers</h4>
                      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                        {latestRevision.responseToReviewers}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
