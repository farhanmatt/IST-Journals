"use client";

import { useState } from "react";
import { submitReview } from "./actions";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Loader2, Send, ShieldAlert, Award, FileText } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export function SubmitReviewClient({ assignmentId }: { assignmentId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const confirm = useConfirm();

  const [recommendation, setRecommendation] = useState("ACCEPT");
  const [commentsForAuthor, setCommentsForAuthor] = useState("");
  const [commentsForEditor, setCommentsForEditor] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmed = await confirm({
      title: "Submit Peer Review",
      message: (
        <div className="space-y-2">
          <p>Are you sure you want to finalize and submit this peer review?</p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-700">
            <div className="flex justify-between items-center">
              <span>Recommendation:</span>
              <span className="font-bold text-blue-600">{recommendation.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <p className="text-xs text-amber-600 font-medium">This action cannot be undone once submitted.</p>
        </div>
      ),
      confirmText: "Submit Review",
      cancelText: "Cancel",
      variant: "warning",
    });
    if (!confirmed) return;
    
    setLoading(true);
    setMessage(null);

    try {
      const res = await submitReview(assignmentId, {
        recommendation,
        commentsForAuthor,
        commentsForEditor
      });
      
      if (res?.success) {
        setMessage({
          type: "success",
          text: res.message || "Review submitted successfully! Redirecting..."
        });
        router.push("/reviewer/completed");
        router.refresh();
      } else {
        setMessage({
          type: "error",
          text: res?.error || "Failed to submit review. Please try again."
        });
        setLoading(false);
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "An unexpected error occurred while submitting review."
      });
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Submit Evaluation Report</h3>
          <p className="text-xs text-slate-500 mt-0.5">Provide your peer review evaluation, recommendation, and feedback.</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Award className="w-5 h-5" />
        </div>
      </div>

      {message && (
        <div className="px-6 pt-6">
          <div
            className={`flex items-center p-4 rounded-xl text-xs sm:text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 mr-3 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-3 text-red-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Editorial Recommendation *
          </label>
          <select 
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            value={recommendation}
            onChange={e => setRecommendation(e.target.value)}
            required
          >
            <option value="ACCEPT">Accept Submission (Publish as is or minor formatting)</option>
            <option value="MINOR_REVISION">Minor Revision Required (Authors must address small points)</option>
            <option value="MAJOR_REVISION">Major Revision Required (Substantial revisions and re-evaluation required)</option>
            <option value="REJECT">Reject Submission (Does not meet standards or scope)</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Comments for the Author *
            </label>
            <span className="text-[11px] text-slate-400">Visible to Authors</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            Detailed, constructive evaluation of methodology, validity, literature citations, and clarity.
          </p>
          <textarea 
            className="w-full p-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none leading-relaxed"
            rows={8}
            placeholder="Provide constructive feedback, detailed evaluation of methodology, results, and overall quality..."
            value={commentsForAuthor}
            onChange={e => setCommentsForAuthor(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Confidential Comments for the Editor (Optional)
            </label>
            <span className="text-[11px] text-amber-700 font-semibold">Strictly Hidden from Authors</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            Any confidential notes, sensitive concerns, or explicit guidance meant only for the handling editor.
          </p>
          <textarea 
            className="w-full p-3.5 border border-amber-200/80 rounded-xl text-xs sm:text-sm bg-amber-50/40 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none leading-relaxed"
            rows={4}
            placeholder="Confidential comments, originality suspicions, or editorial advice..."
            value={commentsForEditor}
            onChange={e => setCommentsForEditor(e.target.value)}
          />
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button 
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs sm:text-sm disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting Review...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Peer Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
