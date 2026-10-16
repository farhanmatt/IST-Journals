"use client";

import { useState } from "react";
import { respondToInvitation } from "./actions";
import { Check, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export function InvitationActionsClient({ assignmentId, submissionId }: { assignmentId: string, submissionId: string }) {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<"accept" | "decline" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const confirm = useConfirm();

  const handleRespond = async (accept: boolean) => {
    const confirmed = await confirm({
      title: accept ? "Accept Review Invitation" : "Decline Review Invitation",
      message: accept 
        ? "Are you sure you want to accept this review invitation? You will be assigned to evaluate this manuscript and submit a peer review report."
        : "Are you sure you want to decline this review invitation? The editor will be informed and can assign an alternate reviewer.",
      confirmText: accept ? "Accept Invitation" : "Decline Invitation",
      cancelText: "Cancel",
      variant: accept ? "primary" : "danger",
    });
    if (!confirmed) return;
    
    setLoading(true);
    setActionType(accept ? "accept" : "decline");
    setMessage(null);

    try {
      const res = await respondToInvitation(assignmentId, accept);
      
      if (res?.success) {
        setMessage({
          type: "success",
          text: res.message || (accept ? "Invitation accepted! Redirecting to workspace..." : "Invitation declined.")
        });

        if (accept) {
          router.push("/reviewer/assigned/" + submissionId);
          router.refresh();
        } else {
          router.refresh();
        }
      } else {
        setMessage({
          type: "error",
          text: res?.error || "Failed to process invitation response."
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "An unexpected error occurred."
      });
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {message && (
        <div
          className={`flex items-center p-3.5 rounded-xl text-xs sm:text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex items-center space-x-3">
        <button 
          onClick={() => handleRespond(true)}
          disabled={loading}
          className="flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-600/20"
        >
          {actionType === "accept" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          <span>{actionType === "accept" ? "Accepting..." : "Accept Invitation"}</span>
        </button>
        <button 
          onClick={() => handleRespond(false)}
          disabled={loading}
          className="flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {actionType === "decline" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <X className="w-4 h-4 mr-2 text-red-500" />
          )}
          <span>{actionType === "decline" ? "Declining..." : "Decline Invitation"}</span>
        </button>
      </div>
    </div>
  );
}
