"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, ArrowRight, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { sendManuscriptToAuthor } from "../[id]/actions";

interface CompletedReviewActionsProps {
  submissionId: string;
  submissionTitle?: string;
  recommendation?: string | null;
}

export function CompletedReviewActions({
  submissionId,
  submissionTitle,
  recommendation
}: CompletedReviewActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const confirm = useConfirm();

  const isRevision =
    recommendation === "MINOR_REVISION" ||
    recommendation === "MAJOR_REVISION";

  const isReject = recommendation === "REJECT";

  const handleSendToAuthor = async () => {
    const formattedRec = recommendation?.replace(/_/g, " ") || "Revision";

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
    const res = await sendManuscriptToAuthor(submissionId, {
      decision: recommendation || undefined
    });
    setLoading(false);

    if (res?.success) {
      router.refresh();
    } else {
      alert(res?.error || "Failed to send manuscript to Author.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isRevision ? (
        <button
          onClick={handleSendToAuthor}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          <span>{loading ? "Sending to Author..." : "Send to Author"}</span>
        </button>
      ) : isReject ? (
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-red-100 text-red-800 border border-red-200">
          Rejected
        </span>
      ) : (
        <Link
          href={`/editor/submissions/${submissionId}`}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Send className="w-4 h-4 mr-2" />
          <span>Send to Copy Editor</span>
        </Link>
      )}

      <Link
        href={`/editor/submissions/${submissionId}`}
        className="inline-flex items-center px-3 py-2 text-slate-600 hover:text-blue-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
      >
        <span>{isReject ? "View Report" : "View Details"}</span>
        <ArrowRight className="w-3.5 h-3.5 ml-1" />
      </Link>
    </div>
  );
}
