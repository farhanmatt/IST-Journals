"use client";

import { useState } from "react";
import { assignReviewer } from "./actions";
import { UserPlus, Calendar, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export function AssignReviewerClient({ 
  submissionId, 
  availableReviewers, 
  currentAssignments 
}: { 
  submissionId: string, 
  availableReviewers: any[], 
  currentAssignments: string[] 
}) {
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const router = useRouter();
  const confirm = useConfirm();

  // Filter out already assigned reviewers
  const unassigned = availableReviewers.filter(r => !currentAssignments.includes(r.id));

  const handleAssign = async (reviewerId: string) => {
    // Default deadline 14 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const reviewer = availableReviewers.find(r => r.id === reviewerId);
    const confirmed = await confirm({
      title: "Send Review Invitation",
      message: (
        <div className="space-y-2">
          <p>
            Are you sure you want to invite <span className="font-semibold text-slate-900">{reviewer?.name || "this reviewer"}</span> to evaluate this manuscript?
          </p>
          <p className="text-xs text-slate-500">
            A review deadline of 14 days ({dueDate.toLocaleDateString()}) will be assigned.
          </p>
        </div>
      ),
      confirmText: "Send Invitation",
      cancelText: "Cancel",
      variant: "primary",
    });
    if (!confirmed) return;

    setLoading(true);
    setAssigningId(reviewerId);
    const res = await assignReviewer(submissionId, reviewerId, dueDate);
    setLoading(false);
    setAssigningId(null);
    
    if (res.success) {
      router.refresh();
    } else {
      console.error("Assign reviewer error:", res.error);
    }
  };

  if (unassigned.length === 0) {
    return <p className="text-sm text-slate-500">No more reviewers available to assign.</p>;
  }

  return (
    <div className="space-y-3">
      {unassigned.map(reviewer => (
        <div key={reviewer.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-slate-900">{reviewer.name}</p>
            <p className="text-xs text-slate-500">{reviewer.email}</p>
          </div>
          <button
            onClick={() => handleAssign(reviewer.id)}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigningId === reviewer.id ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Inviting...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
