"use client";

import { useState } from "react";
import { saveCopyeditProgress, completeCopyeditingWork, deleteCopyeditedFile } from "./actions";
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
  Download
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/date";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export interface ChecklistState {
  grammarSpelling: boolean;
  punctuationClarity: boolean;
  headingsFormatting: boolean;
  referencesCitations: boolean;
  tablesFiguresCaptions: boolean;
  journalGuidelines: boolean;
  fileUploaded: boolean;
}

const CHECKLIST_ITEMS: { key: keyof ChecklistState; label: string; description: string }[] = [
  { 
    key: "grammarSpelling", 
    label: "Grammar and spelling checked", 
    description: "Checked for grammatical accuracy, spelling, typos, and syntax consistency" 
  },
  { 
    key: "punctuationClarity", 
    label: "Punctuation and sentence clarity checked", 
    description: "Standardized quotes, commas, hyphens, colons, and improved sentence readability" 
  },
  { 
    key: "headingsFormatting", 
    label: "Headings and formatting checked", 
    description: "Verified hierarchical section titles, bold/italic styles, and paragraph layouts" 
  },
  { 
    key: "referencesCitations", 
    label: "References and citations checked", 
    description: "Checked consistency between reference list bibliography and in-text citations" 
  },
  { 
    key: "tablesFiguresCaptions", 
    label: "Tables, figures, and captions checked", 
    description: "Verified table structures, figure callouts, labels, and sequential numbering" 
  },
  { 
    key: "journalGuidelines", 
    label: "Journal formatting guidelines checked", 
    description: "Ensured overall compliance with journal presentation and style guidelines" 
  },
  { 
    key: "fileUploaded", 
    label: "Edited manuscript uploaded", 
    description: "Uploaded revised DOCX or PDF file with tracked changes or language corrections" 
  },
];

export function CopyEditorActionsClient({ 
  submissionId, 
  assignmentStatus, 
  existingChecklist,
  existingNotes,
  dueDate,
  completedAt,
  existingCopyeditedFiles 
}: { 
  submissionId: string;
  assignmentStatus: string;
  existingChecklist?: Partial<ChecklistState> | null;
  existingNotes?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  existingCopyeditedFiles: any[];
}) {
  const router = useRouter();
  const confirm = useConfirm();

  const hasFiles = existingCopyeditedFiles.length > 0;

  const [checklist, setChecklist] = useState<ChecklistState>({
    grammarSpelling: Boolean(existingChecklist?.grammarSpelling),
    punctuationClarity: Boolean(existingChecklist?.punctuationClarity),
    headingsFormatting: Boolean(existingChecklist?.headingsFormatting),
    referencesCitations: Boolean(existingChecklist?.referencesCitations),
    tablesFiguresCaptions: Boolean(existingChecklist?.tablesFiguresCaptions),
    journalGuidelines: Boolean(existingChecklist?.journalGuidelines),
    fileUploaded: hasFiles ? true : Boolean(existingChecklist?.fileUploaded),
  });

  const [notes, setNotes] = useState(existingNotes || "");
  const [savingProgress, setSavingProgress] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const isCompleted = assignmentStatus === "COMPLETED";

  const toggleChecklistItem = (key: keyof ChecklistState) => {
    if (isCompleted) return;
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedChecklistCount = Object.values(checklist).filter(Boolean).length;
  const allChecklistCompleted = completedChecklistCount === CHECKLIST_ITEMS.length;
  const canComplete = allChecklistCompleted && hasFiles && !isCompleted;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = [".docx", ".doc", ".pdf"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setMessage({
        type: "error",
        text: `Invalid file format "${fileExt}". Please upload a DOCX or PDF manuscript.`,
      });
      e.target.value = "";
      return;
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage({
        type: "error",
        text: `File exceeds 20MB limit. Selected file size: ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
      });
      e.target.value = "";
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("submissionId", submissionId);
    formData.append("type", "COPYEDITED_FILE");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Copyedited manuscript "${file.name}" uploaded successfully!` });
        setChecklist(prev => ({ ...prev, fileUploaded: true }));
        router.refresh();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to upload file." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Network error uploading file." });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    const confirmed = await confirm({
      title: "Remove Copyedited File",
      message: (
        <div className="space-y-2">
          <p>
            Are you sure you want to remove <span className="font-semibold text-slate-900">{fileName}</span>?
          </p>
          <p className="text-xs text-slate-500">You can upload a replacement file with your copyediting corrections.</p>
        </div>
      ),
      confirmText: "Remove File",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;

    setDeletingFileId(fileId);
    setMessage(null);

    const res = await deleteCopyeditedFile(submissionId, fileId);
    setDeletingFileId(null);

    if (res?.success) {
      setMessage({ type: "success", text: `File "${fileName}" removed successfully.` });
      // If no files remain after deleting, uncheck fileUploaded
      if (existingCopyeditedFiles.length <= 1) {
        setChecklist(prev => ({ ...prev, fileUploaded: false }));
      }
      router.refresh();
    } else {
      setMessage({ type: "error", text: res?.error || "Failed to delete file." });
    }
  };

  const handleSaveProgress = async () => {
    setSavingProgress(true);
    setMessage(null);
    const res = await saveCopyeditProgress(submissionId, { checklist, notes });
    setSavingProgress(false);

    if (res?.success) {
      setMessage({ type: "success", text: "Progress saved successfully! You can return to continue later." });
      router.refresh();
    } else {
      setMessage({ type: "error", text: res?.error || "Failed to save progress." });
    }
  };

  const handleCompleteSubmission = async () => {
    setSubmittingFinal(true);
    setMessage(null);
    const res = await completeCopyeditingWork(submissionId, { checklist, notes });
    setSubmittingFinal(false);

    if (res?.success) {
      setMessage({ type: "success", text: "Copyediting completed! The Handling Editor has been notified." });
      setShowSubmitModal(false);
      router.refresh();
    } else {
      setMessage({ type: "error", text: res?.error || "Failed to complete copyediting." });
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 text-sm rounded-xl border flex items-start gap-2.5 transition-all ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{message.text}</span>
        </div>
      )}

      {/* Assignment Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assignment Status</h3>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mt-1.5 ${
                assignmentStatus === "COMPLETED"
                  ? "bg-emerald-100 text-emerald-800"
                  : assignmentStatus === "IN_PROGRESS"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {assignmentStatus === "COMPLETED" && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
              {assignmentStatus === "IN_PROGRESS" && <Clock className="w-3.5 h-3.5 mr-1" />}
              {assignmentStatus.replace(/_/g, " ")}
            </span>
          </div>

          <div className="text-right">
            {dueDate && (
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Due Date</span>
                <p className="text-xs font-semibold text-slate-700">{new Date(dueDate).toLocaleDateString()}</p>
              </div>
            )}
            {completedAt && (
              <div className="mt-1">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Completed On</span>
                <p className="text-xs font-semibold text-emerald-700">{new Date(completedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Copyediting Checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-emerald-600" />
              Copyediting Checklist ({completedChecklistCount}/{CHECKLIST_ITEMS.length})
            </h4>
          </div>

          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item) => (
              <label
                key={item.key}
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  checklist[item.key]
                    ? "bg-emerald-50/60 border-emerald-200"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                } ${isCompleted ? "cursor-default" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checklist[item.key]}
                  disabled={isCompleted}
                  onChange={() => toggleChecklistItem(item.key)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold ${checklist[item.key] ? "text-emerald-950" : "text-slate-800"}`}>
                    {item.label}
                  </p>
                  <p className="text-[11px] text-slate-500">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Copyeditor Notes for Editor */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Comments / Notes for the Editor
          </label>
          <textarea
            rows={3}
            value={notes}
            disabled={isCompleted}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add comments on changes made, queries for the author, or specific styling adjustments..."
            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100"
          />
        </div>

        {/* Upload Edited Manuscript Box */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Upload Edited Manuscript (Versioned)
          </label>
          <div className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 rounded-xl p-4 text-center bg-emerald-50/20 transition-all">
            <Upload className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
            <label className={isCompleted ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}>
              <span className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                {uploading ? "Uploading..." : "Click to Upload Corrected Manuscript"}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">DOCX or PDF format (max 20MB, auto-versioned)</p>
              <input
                type="file"
                accept=".docx,.doc,.pdf"
                className="hidden"
                disabled={uploading || isCompleted}
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Uploaded Copyedited Files List with Replace / Delete */}
          {existingCopyeditedFiles.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                Uploaded Versions ({existingCopyeditedFiles.length}):
              </span>
              <div className="space-y-1.5">
                {existingCopyeditedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 truncate">{file.originalName}</span>
                          <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 font-bold text-[9px] rounded">
                            v{file.version}
                          </span>
                        </div>
                        {file.createdAt && (
                          <p className="text-[10px] text-slate-500">
                            {formatDateTime(file.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={file.url}
                        download
                        target="_blank"
                        className="text-emerald-700 hover:text-emerald-900 p-1"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      {!isCompleted && (
                        <button
                          onClick={() => handleDeleteFile(file.id, file.originalName)}
                          disabled={deletingFileId === file.id}
                          className="text-rose-500 hover:text-rose-700 p-1 transition-colors disabled:opacity-50"
                          title="Remove incorrect upload"
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
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isCompleted && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleSaveProgress}
              disabled={savingProgress || uploading}
              className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg font-medium text-xs transition-colors disabled:opacity-50"
            >
              {savingProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Progress</span>
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submittingFinal || uploading || !canComplete}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Complete Copyediting</span>
            </button>

            {!canComplete && (
              <div className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  To complete copyediting:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                  {!hasFiles && <li>Upload at least one edited manuscript file</li>}
                  {!allChecklistCompleted && (
                    <li>
                      Complete all 7 checklist items ({completedChecklistCount}/{CHECKLIST_ITEMS.length})
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {isCompleted && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Copyediting for this manuscript has been marked completed.</span>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Complete Copyediting Confirmation
              </h4>
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to finalize copyediting for this manuscript?
              The Editor will be notified, your edited manuscript will be saved as the official copyedited version, and this task will move to your Completed Copyediting section.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
              <p>• Completed Checklist Items: <strong>{completedChecklistCount}/{CHECKLIST_ITEMS.length}</strong></p>
              <p>• Uploaded Edited Files: <strong>{existingCopyeditedFiles.length} file(s)</strong></p>
              {notes && <p className="italic text-slate-500 truncate">• Notes: &quot;{notes}&quot;</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submittingFinal}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSubmission}
                disabled={submittingFinal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingFinal ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Confirm & Complete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
