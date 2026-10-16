"use client";

import { useState } from "react";
import { saveProductionProgress, submitToEditorForFinalApproval, deleteProductionFile } from "./actions";
import { 
  Check, 
  Upload, 
  AlertCircle, 
  FileText, 
  Send, 
  CheckCircle2, 
  Save, 
  Clock, 
  Loader2,
  ListChecks,
  Trash2,
  Download,
  BookOpen,
  Code2,
  Layers,
  FileCheck,
  AlertTriangle,
  Eye
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/date";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export interface ProductionChecklistState {
  layoutFormatting: boolean;
  headingsHierarchy: boolean;
  tablesFiguresHighRes: boolean;
  citationsReferencesStyle: boolean;
  pageNumbersRunningHeaders: boolean;
  metadataAndDoiVerified: boolean;
  finalPdfProofGenerated: boolean;
}

const CHECKLIST_ITEMS: { key: keyof ProductionChecklistState; label: string; description: string }[] = [
  { 
    key: "layoutFormatting", 
    label: "Layout & Typography Formatting", 
    description: "Verified multi-column/single-column typography, line spacing, margins, and journal styling" 
  },
  { 
    key: "headingsHierarchy", 
    label: "Section Headings & Hierarchy", 
    description: "Verified numbering, font weights, and hierarchical consistency of all section headings" 
  },
  { 
    key: "tablesFiguresHighRes", 
    label: "Tables, Figures & High-Resolution Galleys", 
    description: "Verified figure resolution (300+ DPI), table alignments, legends, and caption callouts" 
  },
  { 
    key: "citationsReferencesStyle", 
    label: "Citations & Reference Styling", 
    description: "Ensured reference citations conform to journal citation format with active DOIs/URLs" 
  },
  { 
    key: "pageNumbersRunningHeaders", 
    label: "Running Headers, Footers & Page Numbers", 
    description: "Verified running titles, journal issue details, copyright line, and sequential page numbering" 
  },
  { 
    key: "metadataAndDoiVerified", 
    label: "Metadata, DOI & Author Affiliations", 
    description: "Confirmed author names, affiliations, ORCID IDs, corresponding author details, and registered DOI" 
  },
  { 
    key: "finalPdfProofGenerated", 
    label: "Final PDF Proof Galley Generated", 
    description: "Generated and thoroughly proofread the publication-ready PDF galley" 
  },
];

export interface PublicationMetadataState {
  volume?: string;
  issue?: string;
  year?: string;
  pageRange?: string;
  doi?: string;
  articleOrder?: string;
  publicationDate?: string;
  issueId?: string;
}

export function ProductionActionsClient({ 
  submissionId, 
  assignmentStatus, 
  submissionStatus = "PRODUCTION",
  existingChecklist,
  existingNotes,
  existingMetadata,
  dueDate,
  completedAt,
  productionFiles,
  availableIssues = []
}: { 
  submissionId: string;
  assignmentStatus: string;
  submissionStatus?: string;
  existingChecklist?: Partial<ProductionChecklistState> | null;
  existingNotes?: string | null;
  existingMetadata?: Partial<PublicationMetadataState> | null;
  dueDate?: string | null;
  completedAt?: string | null;
  productionFiles: any[];
  availableIssues?: { id: string; volume: number; issueNumber: number; year: number; status: string }[];
}) {
  const router = useRouter();
  const confirm = useConfirm();

  const pdfFiles = productionFiles.filter(f => f.type === "PRODUCTION_READY_PDF");
  const htmlFiles = productionFiles.filter(f => f.type === "PRODUCTION_READY_HTML");
  const suppFiles = productionFiles.filter(f => f.type === "SUPPLEMENTARY");

  const [checklist, setChecklist] = useState<ProductionChecklistState>({
    layoutFormatting: Boolean(existingChecklist?.layoutFormatting),
    headingsHierarchy: Boolean(existingChecklist?.headingsHierarchy),
    tablesFiguresHighRes: Boolean(existingChecklist?.tablesFiguresHighRes),
    citationsReferencesStyle: Boolean(existingChecklist?.citationsReferencesStyle),
    pageNumbersRunningHeaders: Boolean(existingChecklist?.pageNumbersRunningHeaders),
    metadataAndDoiVerified: Boolean(existingChecklist?.metadataAndDoiVerified),
    finalPdfProofGenerated: pdfFiles.length > 0 ? true : Boolean(existingChecklist?.finalPdfProofGenerated),
  });

  const [metadata, setMetadata] = useState<PublicationMetadataState>({
    volume: existingMetadata?.volume || "",
    issue: existingMetadata?.issue || "",
    year: existingMetadata?.year || new Date().getFullYear().toString(),
    pageRange: existingMetadata?.pageRange || "",
    doi: existingMetadata?.doi || "",
    articleOrder: existingMetadata?.articleOrder || "1",
    publicationDate: existingMetadata?.publicationDate || new Date().toISOString().split("T")[0],
    issueId: existingMetadata?.issueId || "",
  });

  const [notes, setNotes] = useState(existingNotes || "");
  const [savingProgress, setSavingProgress] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const isPublished = submissionStatus === "PUBLISHED";
  const isPendingApproval = submissionStatus === "PENDING_FINAL_APPROVAL";
  const isCorrectionsRequired = submissionStatus === "PRODUCTION_CORRECTIONS_REQUIRED";
  const isCompleted = isPublished || assignmentStatus === "COMPLETED";
  const isLocked = isPublished || isPendingApproval;

  const toggleChecklistItem = (key: keyof ProductionChecklistState) => {
    if (isLocked) return;
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedChecklistCount = Object.values(checklist).filter(Boolean).length;
  const allChecklistCompleted = completedChecklistCount === CHECKLIST_ITEMS.length;
  const hasPdfProof = pdfFiles.length > 0;
  const canComplete = allChecklistCompleted && hasPdfProof && !isLocked;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: "PRODUCTION_READY_PDF" | "PRODUCTION_READY_HTML" | "SUPPLEMENTARY") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extensions
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (fileType === "PRODUCTION_READY_PDF" && fileExt !== ".pdf") {
      setMessage({
        type: "error",
        text: `Invalid file format "${fileExt}". Final publication proof must be a PDF (.pdf).`,
      });
      e.target.value = "";
      return;
    }

    if (fileType === "PRODUCTION_READY_HTML" && !([".html", ".htm", ".xml", ".zip"].includes(fileExt))) {
      setMessage({
        type: "error",
        text: `Invalid file format "${fileExt}". Please upload an HTML, XML, or ZIP file.`,
      });
      e.target.value = "";
      return;
    }

    // Max size 35MB
    const maxSize = 35 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage({
        type: "error",
        text: `File exceeds 35MB limit. Selected size: ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
      });
      e.target.value = "";
      return;
    }

    setUploadingType(fileType);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("submissionId", submissionId);
    formData.append("type", fileType);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `File "${file.name}" uploaded successfully!` });
        if (fileType === "PRODUCTION_READY_PDF") {
          setChecklist(prev => ({ ...prev, finalPdfProofGenerated: true }));
        }
        router.refresh();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to upload file." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Network error uploading file." });
    } finally {
      setUploadingType(null);
      e.target.value = "";
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    const confirmed = await confirm({
      title: "Remove Production File",
      message: (
        <div className="space-y-2">
          <p>
            Are you sure you want to remove <span className="font-semibold text-slate-900">{fileName}</span>?
          </p>
          <p className="text-xs text-red-600 font-medium">This file will be permanently deleted from the production repository.</p>
        </div>
      ),
      confirmText: "Remove File",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;

    setDeletingFileId(fileId);
    setMessage(null);

    try {
      const res = await deleteProductionFile(submissionId, fileId);
      if (res.success) {
        setMessage({ type: "success", text: `Removed "${fileName}".` });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete file." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Error deleting file." });
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleSaveProgress = async () => {
    setSavingProgress(true);
    setMessage(null);

    try {
      const res = await saveProductionProgress(submissionId, {
        checklist,
        notes,
        metadata,
      });

      if (res.success) {
        setMessage({ type: "success", text: "Production progress, checklist, and metadata saved successfully!" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to save progress." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred while saving." });
    } finally {
      setSavingProgress(false);
    }
  };

  const handleCompleteFinal = async () => {
    setSubmittingFinal(true);
    setMessage(null);

    try {
      const res = await submitToEditorForFinalApproval(submissionId, {
        checklist,
        notes,
        metadata,
      });

      if (res.success) {
        setShowSubmitModal(false);
        setMessage({ 
          type: "success", 
          text: "Submitted to Editor for Final Approval! The Handling Editor has been notified." 
        });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to submit for approval." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred while submitting." });
    } finally {
      setSubmittingFinal(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Feedback banner */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center justify-between animate-in fade-in duration-200 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
          <button 
            onClick={() => setMessage(null)}
            className="text-xs underline hover:opacity-80 ml-4 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Published status banner */}
      {isPublished && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Article Officially Published</h3>
              <p className="text-xs text-emerald-100">
                This article has been approved and published to the public journal. Live files are available to visitors.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider">
            Live on Public Journal
          </span>
        </div>
      )}

      {/* Pending Final Approval status banner */}
      {!isPublished && isPendingApproval && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Pending Final Approval</h3>
              <p className="text-xs text-indigo-100">
                Final publication proofs and metadata have been submitted to the Editor for approval and publication.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider">
            Awaiting Editor Review
          </span>
        </div>
      )}

      {/* Production Corrections Required banner */}
      {isCorrectionsRequired && (
        <div className="p-5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 shadow-sm flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-900">Production Corrections Required by Editor</h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                The Editor reviewed the final proofs and requested corrections before publication. Please review the instructions, update the required galleys or metadata, and submit for final approval.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0">
            Action Required
          </span>
        </div>
      )}

      {/* Completion status banner (historical) */}
      {!isPublished && !isPendingApproval && !isCorrectionsRequired && isCompleted && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Production Stage Completed</h3>
              <p className="text-xs text-emerald-100">
                Final publication proofs and metadata were completed on{" "}
                {completedAt ? formatDateTime(completedAt) : "record"}.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider">
            Ready for Scheduling & Publication
          </span>
        </div>
      )}

      {/* 1. Production Files Upload Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Typesetting & Publication Galley Files
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload the finalized publication-ready PDF proof, HTML galleys, and supplementary assets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              hasPdfProof ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {hasPdfProof ? 'PDF Proof Ready' : 'PDF Proof Required'}
            </span>
          </div>
        </div>

        {/* Upload Buttons Grid */}
        {!isCompleted && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upload PDF */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-1">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Final Publication PDF
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  High-res print/web PDF with full journal branding and page numbers. (Required)
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
                {uploadingType === "PRODUCTION_READY_PDF" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Proof PDF</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf"
                  disabled={uploadingType !== null}
                  onChange={(e) => handleFileUpload(e, "PRODUCTION_READY_PDF")}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload HTML */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-1">
                  <Code2 className="w-4 h-4 text-blue-600" />
                  HTML / XML Galley
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Web-ready full-text HTML, JATS XML, or zipped package for online reading.
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
                {uploadingType === "PRODUCTION_READY_HTML" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Web Galley</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".html,.htm,.xml,.zip"
                  disabled={uploadingType !== null}
                  onChange={(e) => handleFileUpload(e, "PRODUCTION_READY_HTML")}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Supplementary */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                  <Layers className="w-4 h-4 text-slate-600" />
                  Supplementary Files
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Final high-res figures, datasets, appendices, or media attachments.
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
                {uploadingType === "SUPPLEMENTARY" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Supplementary</span>
                  </>
                )}
                <input
                  type="file"
                  disabled={uploadingType !== null}
                  onChange={(e) => handleFileUpload(e, "SUPPLEMENTARY")}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Uploaded Production Files List */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Uploaded Publication Files ({productionFiles.length})
          </h3>
          {productionFiles.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {productionFiles.map((file) => {
                const isPdf = file.type === "PRODUCTION_READY_PDF";
                const isHtml = file.type === "PRODUCTION_READY_HTML";

                return (
                  <div key={file.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isPdf ? 'bg-red-50 text-red-600' : isHtml ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isPdf ? <FileText className="w-5 h-5" /> : isHtml ? <Code2 className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {file.originalName}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            isPdf ? 'bg-red-100 text-red-800' : isHtml ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {file.type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span>{(file.size / 1024).toFixed(0)} KB</span>
                          <span>&bull;</span>
                          <span>Uploaded: {formatDateTime(file.createdAt)}</span>
                          {file.version && <span>&bull; v{file.version}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {file.originalName.toLowerCase().endsWith(".pdf") && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-md transition-colors"
                          title="Preview PDF proof in browser"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </a>
                      )}
                      <a
                        href={file.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                      {!isCompleted && (
                        <button
                          onClick={() => handleDeleteFile(file.id, file.originalName)}
                          disabled={deletingFileId === file.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md text-xs font-semibold transition-colors"
                          title="Remove uploaded file"
                        >
                          {deletingFileId === file.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              <FileCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">No publication galleys uploaded yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload the finalized PDF proof above to unlock completion.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Publication Metadata Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Publication Metadata & Scheduling
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Specify DOI, issue volume, pagination, and publication date for indexation and cataloging.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Issue Selector if available */}
          {availableIssues.length > 0 && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Issue
              </label>
              <select
                disabled={isCompleted}
                value={metadata.issueId || ""}
                onChange={(e) => {
                  const selected = availableIssues.find(i => i.id === e.target.value);
                  setMetadata(prev => ({
                    ...prev,
                    issueId: e.target.value,
                    volume: selected ? selected.volume.toString() : prev.volume,
                    issue: selected ? selected.issueNumber.toString() : prev.issue,
                    year: selected ? selected.year.toString() : prev.year,
                  }));
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select an existing issue...</option>
                {availableIssues.map(issue => (
                  <option key={issue.id} value={issue.id}>
                    Vol. {issue.volume} No. {issue.issueNumber} ({issue.year}) - {issue.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Volume
            </label>
            <input
              type="text"
              disabled={isCompleted}
              placeholder="e.g. 14"
              value={metadata.volume || ""}
              onChange={(e) => setMetadata(prev => ({ ...prev, volume: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Issue Number
            </label>
            <input
              type="text"
              disabled={isCompleted}
              placeholder="e.g. 2"
              value={metadata.issue || ""}
              onChange={(e) => setMetadata(prev => ({ ...prev, issue: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Publication Year
            </label>
            <input
              type="text"
              disabled={isCompleted}
              placeholder="e.g. 2026"
              value={metadata.year || ""}
              onChange={(e) => setMetadata(prev => ({ ...prev, year: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Page Range
            </label>
            <input
              type="text"
              disabled={isCompleted}
              placeholder="e.g. 105-122"
              value={metadata.pageRange || ""}
              onChange={(e) => setMetadata(prev => ({ ...prev, pageRange: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Digital Object Identifier (DOI)
            </label>
            <input
              type="text"
              disabled={isCompleted}
              placeholder="e.g. 10.1016/j.jast.2026.04.01"
              value={metadata.doi || ""}
              onChange={(e) => setMetadata(prev => ({ ...prev, doi: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Article Order / Number
            </label>
            <input
              type="number"
              disabled={isCompleted}
              placeholder="1"
              value={metadata.articleOrder || "1"}
              onChange={(e) => setMetadata(prev => ({ ...prev, articleOrder: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Publication Date
            </label>
            <input
              type="date"
              disabled={isCompleted}
              value={metadata.publicationDate || ""}
              onChange={(e) => setMetadata(prev => ({ ...prev, publicationDate: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Quality Assurance Checklist Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-indigo-600" />
              Pre-Publication Quality Checklist
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete each verification task before marking production as complete.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {completedChecklistCount} of {CHECKLIST_ITEMS.length} Checked
            </span>
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = checklist[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggleChecklistItem(item.key)}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 select-none ${
                  isCompleted ? "cursor-default" : "cursor-pointer hover:border-indigo-300"
                } ${
                  isChecked 
                    ? "bg-indigo-50/40 border-indigo-200" 
                    : "bg-white border-slate-200 hover:bg-slate-50/50"
                }`}
              >
                <div className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                  isChecked ? "bg-indigo-600 text-white" : "border-2 border-slate-300 bg-white"
                }`}>
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${
                    isChecked ? "text-indigo-950" : "text-slate-800"
                  }`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Production Notes & Comments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Production Editor Notes</h2>
          <p className="text-xs text-slate-500">
            Document layout choices, notes for the Editor, proof corrections, or special instructions.
          </p>
        </div>
        <textarea
          rows={4}
          disabled={isCompleted}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. High-res figures inserted, citations aligned with journal style guide. Ready for author proofing or immediate issue scheduling."
          className="w-full p-3.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
        />
      </div>

      {/* 5. Sticky Bottom Action Bar */}
      {!isLocked && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              {hasPdfProof 
                ? (allChecklistCompleted 
                    ? (isCorrectionsRequired ? "Ready to re-submit corrected proofs!" : "Ready to submit for final approval!") 
                    : "Check all items to proceed.")
                : "Upload publication PDF proof to proceed."}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleSaveProgress}
              disabled={savingProgress}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              {savingProgress ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Progress</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={!canComplete}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                canComplete
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-slate-300 cursor-not-allowed opacity-60"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isCorrectionsRequired ? "Send Corrected Galleys to Editor" : "Send Back to Editor for Final Approval"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isCorrectionsRequired ? "Submit Corrected Galleys?" : "Submit to Editor for Final Approval?"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This will submit the finalized publication PDF proofs, galleys, and publication metadata to the Editor for review, approval, and official publication.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>PDF Proof Files:</span>
                <span className="font-semibold text-slate-900">{pdfFiles.length} file(s)</span>
              </div>
              <div className="flex justify-between">
                <span>Checklist Items:</span>
                <span className="font-semibold text-emerald-600">7/7 Complete</span>
              </div>
              {metadata.doi && (
                <div className="flex justify-between">
                  <span>Registered DOI:</span>
                  <span className="font-semibold text-slate-900">{metadata.doi}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submittingFinal}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteFinal}
                disabled={submittingFinal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                {submittingFinal ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm & Submit to Editor</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
