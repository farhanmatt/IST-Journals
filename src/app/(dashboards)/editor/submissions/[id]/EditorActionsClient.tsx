"use client";

import { useState } from "react";
import { 
  updateSubmissionStatus, 
  submitEditorialDecision, 
  sendToCopyediting, 
  sendToProduction,
  approveAndPublishArticle,
  requestProductionCorrections,
  startNewReviewRound,
  sendManuscriptToAuthor
} from "./actions";
import { Check, X, XCircle, AlertCircle, Send, ArrowRight, FileCheck, CheckCircle2, RotateCcw, ExternalLink, Globe, Clock, UserCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export function EditorActionsClient({ 
  submissionId, 
  status, 
  reviewers,
  availableReviewers = [],
  copyeditors = [],
  copyeditorAssignments = [],
  productionEditors = [],
  productionAssignments = [],
  availableIssues = [],
  publishedArticle = null,
  files = [],
  decisions = [],
  revisions = []
}: { 
  submissionId: string, 
  status: string, 
  reviewers: any[],
  availableReviewers?: any[],
  copyeditors?: any[],
  copyeditorAssignments?: any[],
  productionEditors?: any[],
  productionAssignments?: any[],
  availableIssues?: any[],
  publishedArticle?: any,
  files?: any[],
  decisions?: any[],
  revisions?: any[]
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();
  const confirm = useConfirm();
  
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [decision, setDecision] = useState("ACCEPT");
  const [commentsForAuthor, setCommentsForAuthor] = useState("");
  const [internalComments, setInternalComments] = useState("");

  // Review Round 2 Modal State
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [selectedRoundReviewerId, setSelectedRoundReviewerId] = useState(
    reviewers[0]?.reviewerId || reviewers[0]?.reviewer?.id || availableReviewers[0]?.id || ""
  );
  const [roundDueDate, setRoundDueDate] = useState("");
  const [roundInstructions, setRoundInstructions] = useState("");

  const [showCopyeditModal, setShowCopyeditModal] = useState(false);
  const [selectedCopyeditorId, setSelectedCopyeditorId] = useState(copyeditors[0]?.id || "");
  const [copyeditDueDate, setCopyeditDueDate] = useState("");
  const [copyeditInstructions, setCopyeditInstructions] = useState("");

  const [showProductionModal, setShowProductionModal] = useState(false);
  const [selectedProductionEditorId, setSelectedProductionEditorId] = useState(productionEditors[0]?.id || "");
  const [productionDueDate, setProductionDueDate] = useState("");
  const [productionInstructions, setProductionInstructions] = useState("");

  // Publish Modal State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(publishedArticle?.issueId || availableIssues[0]?.id || "");
  const [publishDoi, setPublishDoi] = useState(publishedArticle?.doi || "");
  const [publishPageRange, setPublishPageRange] = useState(publishedArticle?.pageRange || "");
  const [publishDate, setPublishDate] = useState(
    publishedArticle?.publishedAt 
      ? new Date(publishedArticle.publishedAt).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );

  // Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState("");

  const handleApproveAndPublish = async () => {
    if (!selectedIssueId) {
      setMessage({ type: 'error', text: 'Please select a publication issue.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    const res = await approveAndPublishArticle(submissionId, {
      issueId: selectedIssueId,
      doi: publishDoi || undefined,
      pageRange: publishPageRange || undefined,
      publishedAt: publishDate || undefined
    });
    setLoading(false);
    if (res?.success) {
      setMessage({ type: 'success', text: 'Manuscript approved and published successfully!' });
      setShowPublishModal(false);
      router.refresh();
    } else {
      setMessage({ type: 'error', text: res?.error || 'Failed to publish article.' });
    }
  };

  const handleRequestCorrections = async () => {
    if (!correctionNotes.trim()) {
      setMessage({ type: 'error', text: 'Please provide correction instructions for the production editor.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    const res = await requestProductionCorrections(submissionId, {
      correctionNotes: correctionNotes.trim()
    });
    setLoading(false);
    if (res?.success) {
      setMessage({ type: 'success', text: 'Corrections requested. Production Editor has been notified.' });
      setShowCorrectionModal(false);
      router.refresh();
    } else {
      setMessage({ type: 'error', text: res?.error || 'Failed to request corrections.' });
    }
  };

  const handleSendToProduction = async () => {
    setLoading(true);
    setMessage(null);
    const res = await sendToProduction(submissionId, {
      productionEditorId: selectedProductionEditorId || undefined,
      dueDate: productionDueDate || undefined,
      instructions: productionInstructions
    });
    setLoading(false);
    if (res?.success) {
      setMessage({ type: 'success', text: 'Manuscript assigned to Production Editor successfully.' });
      setShowProductionModal(false);
      router.refresh();
    } else {
      setMessage({ type: 'error', text: res?.error || 'Failed to send to production.' });
    }
  };

  const handleSendToCopyediting = async () => {
    setLoading(true);
    setMessage(null);
    const res = await sendToCopyediting(submissionId, {
      copyeditorId: selectedCopyeditorId || undefined,
      dueDate: copyeditDueDate || undefined,
      instructions: copyeditInstructions
    });
    setLoading(false);
    if (res?.success) {
      setMessage({ type: 'success', text: 'Manuscript assigned to Copy Editor successfully.' });
      setShowCopyeditModal(false);
      router.refresh();
    } else {
      setMessage({ type: 'error', text: res?.error || 'Failed to send to copyediting.' });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const formattedStatus = newStatus.replace(/_/g, ' ');
    const isDestructive = newStatus === "REJECTED";
    const confirmed = await confirm({
      title: "Change Submission Status",
      message: (
        <div className="space-y-2">
          <p>Are you sure you want to change the status of this submission?</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
            <span>New Status:</span>
            <span className="font-semibold text-blue-600">{formattedStatus}</span>
          </div>
        </div>
      ),
      confirmText: isDestructive ? "Confirm Rejection" : "Change Status",
      cancelText: "Cancel",
      variant: isDestructive ? "danger" : "warning",
    });
    if (!confirmed) return;

    setLoading(true);
    setMessage(null);
    const res = await updateSubmissionStatus(submissionId, newStatus);
    setLoading(false);
    if (res?.success) {
      setMessage({ type: 'success', text: 'Status updated successfully.' });
      router.refresh();
    } else {
      setMessage({ type: 'error', text: res?.error || 'Failed to update status.' });
    }
  };

  const handleDecisionSubmit = async () => {
    const isReject = decision === "REJECT";
    const confirmed = await confirm({
      title: isReject ? "Confirm Manuscript Rejection" : "Save Editorial Decision",
      message: (
        <div className="space-y-2">
          <p>
            {isReject 
              ? "Are you sure you want to reject this manuscript? This will record the decision and notify the author."
              : `Are you sure you want to record the editorial decision "${decision.replace(/_/g, ' ')}"?`}
          </p>
        </div>
      ),
      confirmText: isReject ? "Confirm Rejection" : "Save Decision",
      cancelText: "Cancel",
      variant: isReject ? "danger" : "warning",
    });
    if (!confirmed) return;

    setLoading(true);
    setMessage(null);
    const res = await submitEditorialDecision(submissionId, { decision, commentsForAuthor, internalComments });
    setLoading(false);
    if (res?.success) {
      setMessage({ type: 'success', text: 'Decision recorded successfully.' });
      setShowDecisionForm(false);
      router.refresh();
    } else {
      setMessage({ type: 'error', text: res?.error || 'Failed to record decision.' });
    }
  };

  const handleStartRound = async () => {
    if (!selectedRoundReviewerId) {
      setMessage({ type: 'error', text: 'Please select a reviewer to assign for the review round.' });
      return;
    }
    const confirmed = await confirm({
      title: "Start New Review Round",
      message: (
        <div className="space-y-2">
          <p>
            Are you sure you want to invite this reviewer to evaluate the revised manuscript? The manuscript status will change to <strong>Under Review</strong>.
          </p>
        </div>
      ),
      confirmText: "Start Round",
      cancelText: "Cancel",
      variant: "info",
    });
    if (!confirmed) return;

    setLoading(true);
    setMessage(null);
    const res = await startNewReviewRound(submissionId, {
      reviewerId: selectedRoundReviewerId,
      dueDate: roundDueDate || undefined,
      instructions: roundInstructions || undefined,
    });
    setLoading(false);
    if (res?.success) {
      setMessage({ type: 'success', text: 'New review round started successfully! Reviewer invited.' });
      setShowRoundModal(false);
      router.refresh();
    } else {
      setMessage({ type: 'error', text: res?.error || 'Failed to start review round.' });
    }
  };

  const submittedReviews = reviewers.filter(r => r.status === "SUBMITTED");
  const sortedReviews = [...submittedReviews].sort((a, b) => 
    new Date(b.submittedAt || b.createdAt || 0).getTime() - new Date(a.submittedAt || a.createdAt || 0).getTime()
  );
  const latestReview = sortedReviews[0];
  const reviewerRec = latestReview?.recommendation;

  const isRevision = 
    reviewerRec === "MINOR_REVISION" || 
    reviewerRec === "MAJOR_REVISION";
  const isReject = reviewerRec === "REJECT";

  const handleSendToAuthor = async () => {
    const formattedRec = reviewerRec?.replace(/_/g, " ") || "Revision";

    const confirmed = await confirm({
      title: "Send Manuscript to Author",
      message: (
        <div className="space-y-3">
          <p>
            Are you sure you want to send this manuscript back to the Author for revision?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
            <p>
              <span className="font-semibold text-amber-800">Reviewer Recommendation:</span>{" "}
              <span className="font-bold text-amber-950">{formattedRec}</span>
            </p>
            <p className="text-amber-700">
              The manuscript workflow status will update to Revision Required, and the author will be invited to submit an updated manuscript file.
            </p>
          </div>
        </div>
      ),
      confirmText: "Yes, Send to Author",
      cancelText: "Cancel",
      variant: "warning",
    });

    if (!confirmed) {
      // If the Editor clicks Cancel, close the confirmation dialog without sending the manuscript.
      return;
    }

    setLoading(true);
    setMessage(null);
    const res = await sendManuscriptToAuthor(submissionId, {
      decision: reviewerRec,
      commentsForAuthor: commentsForAuthor || undefined,
      internalComments: internalComments || undefined,
    });
    setLoading(false);

    if (res?.success) {
      setMessage({ type: "success", text: "Manuscript sent back to the Author successfully." });
      router.refresh();
    } else {
      setMessage({ type: "error", text: res?.error || "Failed to send manuscript to Author." });
    }
  };

  const MessageBanner = () => message ? (
    <div className={`p-4 mb-4 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200 ${
      message.type === 'success' 
        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
        : 'bg-red-50 text-red-800 border border-red-200'
    }`}>
      {message.type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
      )}
      <span>{message.text}</span>
    </div>
  ) : null;

  if (status === "SUBMITTED") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
        <MessageBanner />
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Editorial Actions</h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          This manuscript is awaiting initial editorial screening before peer review.
        </p>
        <button 
          onClick={() => handleStatusChange("INITIAL_SCREENING")}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Starting Screening...</span>
            </>
          ) : (
            <>
              <span>Start Initial Screening</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    );
  }

  if (status === "INITIAL_SCREENING") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
        <MessageBanner />
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Screening Actions</h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Assess the manuscript for relevance, scope, and quality before sending out for peer review.
        </p>
        
        <button 
          onClick={() => handleStatusChange("UNDER_REVIEW")}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending for Review...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Send for Review</span>
            </>
          )}
        </button>
        
        <button 
          onClick={() => handleStatusChange("REVISION_REQUIRED")}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Requesting Corrections...</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>Request Corrections</span>
            </>
          )}
        </button>

        <button 
          onClick={() => {
            setDecision("DESK_REJECT");
            setShowDecisionForm(true);
          }}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Desk Reject</span>
        </button>

        {showDecisionForm && decision === "DESK_REJECT" && (
          <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
            <textarea 
              className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none" 
              placeholder="Reason for desk rejection (sent to author)..."
              rows={3}
              value={commentsForAuthor}
              onChange={e => setCommentsForAuthor(e.target.value)}
            />
            <button 
              onClick={handleDecisionSubmit}
              disabled={loading || !commentsForAuthor}
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming Rejection...</span>
                </>
              ) : (
                <span>Confirm Rejection</span>
              )}
            </button>
            <button 
              onClick={() => setShowDecisionForm(false)}
              className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  if (status === "UNDER_REVIEW") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
        <MessageBanner />
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Review Progress</h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">Assign reviewers and track peer review evaluation progress.</p>
        
        <div className="space-y-2.5 mb-4">
          {reviewers.map(r => (
            <div key={r.id} className="text-xs border border-slate-200/80 p-3 rounded-xl bg-slate-50/60 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{r.reviewer.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{r.reviewer.email}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                {r.status}
              </span>
            </div>
          ))}
          {reviewers.length === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
              No reviewers assigned yet.
            </p>
          )}
        </div>

        <button 
          onClick={() => router.push(`/editor/submissions/assign-reviewers?id=${submissionId}`)}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-blue-600/20 transition-colors"
        >
          <Users className="w-4 h-4" />
          <span>Assign Reviewers</span>
        </button>

        <button 
          onClick={() => handleStatusChange("REVIEWS_COMPLETED")}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating Status...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Mark Reviews Completed</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (status === "REVISION_REQUIRED") {
    const lastDecision = decisions && decisions.length > 0 ? decisions[0] : null;
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200/80 p-6 space-y-4">
        <MessageBanner />
        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
          <Clock className="w-5 h-5 text-amber-600" />
          <span>Awaiting Author Revision</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The author has been requested to submit revisions based on reviewer and editorial feedback. Once the revised manuscript and rebuttal are uploaded, this submission will transition to <strong>Revision Submitted</strong> for evaluation.
        </p>

        {lastDecision && lastDecision.commentsForAuthor && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
            <span className="font-semibold text-amber-900">
              Instructions Sent to Author ({lastDecision.decision?.replace(/_/g, ' ')}):
            </span>
            <p className="text-slate-800 whitespace-pre-wrap mt-0.5 leading-relaxed">{lastDecision.commentsForAuthor}</p>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          {!showDecisionForm ? (
            <button
              onClick={() => setShowDecisionForm(true)}
              className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-xs transition-colors"
            >
              <span>Update Editorial Decision / Instructions</span>
            </button>
          ) : (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Decision Type</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                  value={decision}
                  onChange={e => setDecision(e.target.value)}
                >
                  <option value="ACCEPT">Accept</option>
                  <option value="MINOR_REVISION">Minor Revision</option>
                  <option value="MAJOR_REVISION">Major Revision</option>
                  <option value="REJECT">Reject</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Comments for Author</label>
                <textarea 
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none leading-relaxed" 
                  rows={4}
                  value={commentsForAuthor}
                  onChange={e => setCommentsForAuthor(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleDecisionSubmit}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-amber-600/20 disabled:opacity-50 transition-colors"
                >
                  Save Decision
                </button>
                <button 
                  onClick={() => setShowDecisionForm(false)}
                  className="px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === "REJECTED" || status === "DESK_REJECTED") {
    const lastDecision = decisions && decisions.length > 0 ? decisions[0] : null;
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-200/80 p-6 space-y-4">
        <MessageBanner />
        <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
          <X className="w-5 h-5 text-red-600" />
          <span>{status === "DESK_REJECTED" ? "Desk Rejected" : "Submission Rejected"}</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          This manuscript has been officially rejected. The editorial and peer review process is completed and closed.
        </p>

        {lastDecision && lastDecision.commentsForAuthor && (
          <div className="p-3.5 bg-red-50/60 border border-red-200 rounded-xl text-xs space-y-1">
            <span className="font-semibold text-red-900">Rejection Feedback Sent to Author:</span>
            <p className="text-slate-800 whitespace-pre-wrap mt-0.5 leading-relaxed">{lastDecision.commentsForAuthor}</p>
          </div>
        )}
      </div>
    );
  }

  if (status === "REVIEWS_COMPLETED" || status === "REVISION_SUBMITTED" || status === "ACCEPTED") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
        <MessageBanner />
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Editorial Actions</h3>

        {status === "REVISION_SUBMITTED" && (
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <RotateCcw className="w-4 h-4 text-blue-600" />
              <span>Revised Manuscript Uploaded</span>
            </div>
            <p className="text-blue-800 leading-relaxed">
              The author submitted revised manuscript files and rebuttal notes. You can initiate Round 2 peer review, record an editorial decision, or advance to copyediting.
            </p>
          </div>
        )}

        <div className="space-y-2 mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Review Summary</p>
          {reviewers.map(r => (
            <div key={r.id} className="text-xs border border-slate-200/80 p-3 rounded-xl bg-slate-50/60">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800">{r.reviewer.name}</span>
                <span className="font-bold text-emerald-700">{r.recommendation?.replace(/_/g, ' ') || r.status}</span>
              </div>
            </div>
          ))}
          {reviewers.length === 0 && <p className="text-xs text-slate-400">No reviewers recorded.</p>}
        </div>

        {/* Start Review Round 2 Button (for REVISION_SUBMITTED) */}
        {status === "REVISION_SUBMITTED" && (
          <div>
            <button
              onClick={() => setShowRoundModal(true)}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-sm shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Starting Round...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Start Review Round 2</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Primary Action: Send to Author (for Minor Revision, Major Revision), Reject info, OR Send to Copy Editor (for Accept) */}
        {isRevision ? (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleSendToAuthor}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-sm shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending to Author...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send to Author</span>
                </>
              )}
            </button>
          </div>
        ) : isReject ? (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-red-800">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Reviewer Recommendation: Reject</span>
              </div>
              <p className="text-red-700 leading-relaxed">
                The reviewer recommended rejection. This manuscript must not be sent back to the author for revision or re-upload.
              </p>
            </div>
            <button
              onClick={() => handleStatusChange("REJECTED")}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-sm shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming Rejection...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowCopyeditModal(true)}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send to Copy Editor</span>
                </>
              )}
            </button>
          </div>
        )}
        
        {!showDecisionForm ? (
          <button 
            onClick={() => setShowDecisionForm(true)}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-indigo-600/20 transition-colors"
          >
            <span>Record Decision</span>
          </button>
        ) : (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Decision Type</label>
              <select 
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                value={decision}
                onChange={e => setDecision(e.target.value)}
              >
                <option value="ACCEPT">Accept</option>
                <option value="MINOR_REVISION">Minor Revision</option>
                <option value="MAJOR_REVISION">Major Revision</option>
                <option value="REJECT">Reject</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Comments for Author</label>
              <textarea 
                className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none leading-relaxed" 
                rows={3}
                value={commentsForAuthor}
                onChange={e => setCommentsForAuthor(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">Internal Comments (Hidden)</label>
              <textarea 
                className="w-full p-3 border border-amber-200/80 rounded-xl text-xs sm:text-sm bg-amber-50/40 text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none leading-relaxed" 
                rows={2}
                value={internalComments}
                onChange={e => setInternalComments(e.target.value)}
              />
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={handleDecisionSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Decision...</span>
                  </>
                ) : (
                  <span>Save Decision</span>
                )}
              </button>
              <button 
                onClick={() => setShowDecisionForm(false)}
                className="px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showCopyeditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 max-w-md w-full p-6 space-y-4 border border-slate-200/80 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <span>Send to Copy Editor</span>
                </h4>
                <button 
                  onClick={() => setShowCopyeditModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                This will transition the manuscript into the <strong>Copyediting</strong> stage. The assigned copy editor will receive access to the manuscript files and instructions.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Select Copy Editor *</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                  value={selectedCopyeditorId}
                  onChange={e => setSelectedCopyeditorId(e.target.value)}
                >
                  <option value="">-- Choose Copy Editor --</option>
                  {copyeditors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.email} ({c.email})
                    </option>
                  ))}
                </select>
                {copyeditors.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No registered copy editors found.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Due Date (Optional)</label>
                <input 
                  type="date"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                  value={copyeditDueDate}
                  onChange={e => setCopyeditDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Instructions / Notes (Optional)</label>
                <textarea 
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none leading-relaxed"
                  rows={3}
                  placeholder="e.g. Please check APA citation formatting, references list, and figure captions."
                  value={copyeditInstructions}
                  onChange={e => setCopyeditInstructions(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowCopyeditModal(false)}
                  disabled={loading}
                  className="px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendToCopyediting}
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Confirm & Send</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRoundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 max-w-md w-full p-6 space-y-4 border border-slate-200/80 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <span>Start Review Round 2</span>
                </h4>
                <button 
                  onClick={() => setShowRoundModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Assign a reviewer to re-evaluate the manuscript in light of the author&apos;s revisions and rebuttal notes. The submission status will change to <strong>Under Review</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Select Reviewer *</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none"
                  value={selectedRoundReviewerId}
                  onChange={e => setSelectedRoundReviewerId(e.target.value)}
                >
                  <option value="">-- Choose Reviewer --</option>
                  {reviewers.length > 0 && (
                    <optgroup label="Previous Reviewers (Recommended)">
                      {reviewers.map(r => (
                        <option key={r.reviewer?.id || r.id} value={r.reviewer?.id || r.reviewerId}>
                          {r.reviewer?.name || r.reviewer?.email} (Round 1: {r.recommendation?.replace(/_/g, ' ') || r.status})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {availableReviewers.length > 0 && (
                    <optgroup label="All Reviewers">
                      {availableReviewers.map(ar => (
                        <option key={ar.id} value={ar.id}>
                          {ar.name || ar.email} ({ar.email})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Review Due Date (Optional)</label>
                <input 
                  type="date"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none"
                  value={roundDueDate}
                  onChange={e => setRoundDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Instructions for Round 2 (Optional)</label>
                <textarea 
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none leading-relaxed"
                  rows={3}
                  placeholder="e.g. Please verify that the authors addressed your questions regarding Methodology Section 3.2."
                  value={roundInstructions}
                  onChange={e => setRoundInstructions(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowRoundModal(false)}
                  disabled={loading}
                  className="px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartRound}
                  disabled={loading || !selectedRoundReviewerId}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm shadow-purple-600/20 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <span>Confirm & Invite</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === "COPYEDITING") {
    const isCompleted = copyeditorAssignments.some(ca => ca.status === "COMPLETED");

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
        <MessageBanner />
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs sm:text-sm">
          <span className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-emerald-600' : 'bg-emerald-500 animate-pulse'}`}></span>
          <span>{isCompleted ? "Copyediting Completed" : "In Copyediting Stage"}</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {isCompleted
            ? "The Copy Editor has completed review, styling, and uploaded the edited manuscript. Review the files below and proceed to Production."
            : "This manuscript is currently in the hands of the Copy Editor. Once edited files are prepared and submitted, they will appear under the manuscript files list below."}
        </p>

        {copyeditorAssignments.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Copy Editor</p>
            {copyeditorAssignments.map(ca => (
              <div key={ca.id} className="text-xs border border-slate-200/80 p-3 rounded-xl bg-slate-50/60 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">{ca.copyeditor?.name || ca.copyeditor?.email}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    ca.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                    ca.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {ca.status === 'COMPLETED' ? 'COMPLETED' : ca.status}
                  </span>
                </div>
                {ca.dueDate && (
                  <p className="text-slate-500 text-[11px]">Due: {new Date(ca.dueDate).toLocaleDateString()}</p>
                )}
                {ca.completedAt && (
                  <p className="text-emerald-700 text-[11px] font-medium">Completed: {new Date(ca.completedAt).toLocaleDateString()}</p>
                )}
                {ca.notes && (
                  <p className="text-slate-600 text-[11px] italic bg-white p-2 rounded-lg border border-slate-200/70 mt-1 leading-relaxed">&quot;{ca.notes}&quot;</p>
                )}
              </div>
            ))}
          </div>
        )}

        {isCompleted && (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowProductionModal(true)}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors disabled:opacity-50 shadow-sm shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
              <span>Send to Production</span>
            </button>
          </div>
        )}

        {/* Modal to assign Production Editor */}
        {showProductionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 max-w-md w-full p-6 space-y-4 border border-slate-200/80 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <span>Send Manuscript to Production</span>
                </h4>
                <button 
                  onClick={() => setShowProductionModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                This will transition the manuscript into the <strong>Production</strong> stage. The assigned Production Editor will prepare publication-ready proofs, final layout, and issue scheduling.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Select Production Editor *</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                  value={selectedProductionEditorId}
                  onChange={e => setSelectedProductionEditorId(e.target.value)}
                >
                  <option value="">-- Choose Production Editor --</option>
                  {productionEditors.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.email} ({p.email})
                    </option>
                  ))}
                </select>
                {productionEditors.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No registered production editors found.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Due Date (Optional)</label>
                <input 
                  type="date"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                  value={productionDueDate}
                  onChange={e => setProductionDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Instructions / Notes (Optional)</label>
                <textarea 
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none leading-relaxed"
                  rows={3}
                  placeholder="e.g. Please format for Volume 4 Issue 2, generate two-column PDF and check author affiliations."
                  value={productionInstructions}
                  onChange={e => setProductionInstructions(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowProductionModal(false)}
                  disabled={loading}
                  className="px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendToProduction}
                  disabled={loading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Confirm & Send</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === "PRODUCTION") {
    const isCompleted = productionAssignments.some(pa => pa.status === "COMPLETED");

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
        <MessageBanner />
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs sm:text-sm">
          <span className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-indigo-600' : 'bg-indigo-500 animate-pulse'}`}></span>
          <span>{isCompleted ? "Production Completed" : "In Production Stage"}</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {isCompleted
            ? "The Production Editor has completed layout typesetting and uploaded the publication-ready files."
            : "This manuscript is currently in production for layout formatting, galley proofs, and issue scheduling."}
        </p>

        {productionAssignments.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Production Editor</p>
            {productionAssignments.map(pa => (
              <div key={pa.id} className="text-xs border border-slate-200/80 p-3 rounded-xl bg-slate-50/60 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">{pa.productionEditor?.name || pa.productionEditor?.email}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    pa.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                    pa.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {pa.status === 'COMPLETED' ? 'COMPLETED' : pa.status}
                  </span>
                </div>
                {pa.dueDate && (
                  <p className="text-slate-500 text-[11px]">Due: {new Date(pa.dueDate).toLocaleDateString()}</p>
                )}
                {pa.completedAt && (
                  <p className="text-emerald-700 text-[11px] font-medium">Completed: {new Date(pa.completedAt).toLocaleDateString()}</p>
                )}
                {pa.notes && (
                  <p className="text-slate-600 text-[11px] italic bg-white p-2 rounded-lg border border-slate-200/70 mt-1 leading-relaxed">&quot;{pa.notes}&quot;</p>
                )}
              </div>
            ))}
          </div>
        )}

        {productionAssignments.length === 0 && (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowProductionModal(true)}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-indigo-600/20 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Assign Production Editor</span>
            </button>
          </div>
        )}

        {/* Modal to assign Production Editor when already in PRODUCTION */}
        {showProductionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 max-w-md w-full p-6 space-y-4 border border-slate-200/80 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <span>Assign Production Editor</span>
                </h4>
                <button 
                  onClick={() => setShowProductionModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Select Production Editor *</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                  value={selectedProductionEditorId}
                  onChange={e => setSelectedProductionEditorId(e.target.value)}
                >
                  <option value="">-- Choose Production Editor --</option>
                  {productionEditors.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.email} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Due Date (Optional)</label>
                <input 
                  type="date"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                  value={productionDueDate}
                  onChange={e => setProductionDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Instructions / Notes (Optional)</label>
                <textarea 
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none leading-relaxed"
                  rows={3}
                  value={productionInstructions}
                  onChange={e => setProductionInstructions(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowProductionModal(false)}
                  disabled={loading}
                  className="px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendToProduction}
                  disabled={loading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <span>Confirm & Assign</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === "PENDING_FINAL_APPROVAL") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-200/80 p-6 space-y-5">
        <MessageBanner />
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Pending Final Approval</span>
        </div>
        
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1 leading-relaxed">
          <p className="font-bold">Production galleys submitted for your approval.</p>
          <p>Please review the galley files, metadata, and quality checks. Once satisfied, approve and publish the manuscript, or return it to the Production Editor for corrections.</p>
        </div>

        {productionAssignments.length > 0 && (
          <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <span className="font-semibold text-slate-700">Assigned Production Editor:</span>
            <p className="font-semibold text-slate-900">{productionAssignments[0].productionEditor?.name || productionAssignments[0].productionEditor?.email}</p>
          </div>
        )}

        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowPublishModal(true)}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-emerald-600/20 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Publish Article</span>
          </button>

          <button
            onClick={() => setShowCorrectionModal(true)}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Request Corrections</span>
          </button>
        </div>

        {/* Modal: Approve & Publish Article */}
        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 max-w-lg w-full p-6 space-y-4 border border-slate-200/80 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span>Approve & Publish Article</span>
                </h4>
                <button 
                  onClick={() => setShowPublishModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Finalizing publication will transition this manuscript to <span className="font-semibold text-emerald-700">PUBLISHED</span> status and make it immediately accessible on the public journal website.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Target Journal Issue *</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                  value={selectedIssueId}
                  onChange={e => setSelectedIssueId(e.target.value)}
                >
                  <option value="">-- Choose Journal Issue --</option>
                  {availableIssues.map(iss => (
                    <option key={iss.id} value={iss.id}>
                      Vol {iss.volume}, No {iss.issueNumber} ({iss.year}) {iss.title ? `- ${iss.title}` : ''} ({iss.status})
                    </option>
                  ))}
                </select>
                {availableIssues.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No issues created yet. Please create an issue in the admin / issue manager first.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Digital Object Identifier (DOI)</label>
                  <input 
                    type="text"
                    placeholder="10.1234/journal.v4i2.01"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                    value={publishDoi}
                    onChange={e => setPublishDoi(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Page Range</label>
                  <input 
                    type="text"
                    placeholder="e.g. 101-118"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                    value={publishPageRange}
                    onChange={e => setPublishPageRange(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Publication Date</label>
                <input 
                  type="date"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                  value={publishDate}
                  onChange={e => setPublishDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowPublishModal(false)}
                  disabled={loading}
                  className="px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveAndPublish}
                  disabled={loading || !selectedIssueId}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Confirm & Publish</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Request Production Corrections */}
        {showCorrectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 max-w-md w-full p-6 space-y-4 border border-slate-200/80 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <span>Request Corrections</span>
                </h4>
                <button 
                  onClick={() => setShowCorrectionModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Return the manuscript to the Production Editor with specific feedback on formatting, metadata, or layout corrections needed.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Correction Instructions *</label>
                <textarea 
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none leading-relaxed"
                  rows={4}
                  placeholder="Detail the required changes (e.g., fix author affiliation typo, re-render figures at 300 DPI, adjust page numbering)..."
                  value={correctionNotes}
                  onChange={e => setCorrectionNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowCorrectionModal(false)}
                  disabled={loading}
                  className="px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestCorrections}
                  disabled={loading || !correctionNotes.trim()}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm shadow-amber-600/20 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Corrections</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === "PRODUCTION_CORRECTIONS_REQUIRED") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200/80 p-6 space-y-4">
        <MessageBanner />
        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs sm:text-sm">
          <RotateCcw className="w-4 h-4 text-amber-600" />
          <span>Corrections In Progress</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The manuscript has been returned to the Production Editor for corrections. Once the updated galleys are ready, the Production Editor will re-submit them for your final approval.
        </p>

        {productionAssignments.length > 0 && productionAssignments[0].notes && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
            <span className="font-semibold text-amber-900">Pending Feedback Sent:</span>
            <p className="text-slate-800 italic leading-relaxed">&quot;{productionAssignments[0].notes}&quot;</p>
          </div>
        )}
      </div>
    );
  }

  if (status === "PUBLISHED") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-blue-200/80 p-6 space-y-4">
        <MessageBanner />
        <div className="flex items-center gap-2 text-blue-800 font-bold text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          <span>Article Published</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          This article is published and live on the public journal website.
        </p>

        {publishedArticle && (
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
            {publishedArticle.issue && (
              <p><span className="font-semibold text-slate-500">Issue:</span> Vol. {publishedArticle.issue.volume}, No. {publishedArticle.issue.issueNumber} ({publishedArticle.issue.year})</p>
            )}
            {publishedArticle.doi && (
              <p><span className="font-semibold text-slate-500">DOI:</span> <span className="font-mono text-blue-700">{publishedArticle.doi}</span></p>
            )}
            {publishedArticle.pageRange && (
              <p><span className="font-semibold text-slate-500">Pages:</span> {publishedArticle.pageRange}</p>
            )}
            {publishedArticle.publishedAt && (
              <p><span className="font-semibold text-slate-500">Published:</span> {new Date(publishedArticle.publishedAt).toLocaleDateString()}</p>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100">
          <a
            href={publishedArticle ? `/article/${publishedArticle.id}` : "/articles"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-blue-600/20"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>View Published Article Online</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
      <MessageBanner />
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</h3>
      <p className="text-xs sm:text-sm text-slate-700">No pending editorial actions required at this stage.</p>
    </div>
  );
}

const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
