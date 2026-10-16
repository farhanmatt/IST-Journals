export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckCircle2, Award } from "lucide-react";

export default async function CompletedReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const assignments = await prisma.reviewerAssignment.findMany({
    where: { reviewerId: session.user.id, status: "SUBMITTED" },
    orderBy: { submittedAt: "desc" },
    include: { submission: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Completed Reviews</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Archive and history of your completed peer reviews.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/75 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Manuscript</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted On</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Recommendation</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-xs sm:text-sm">
                {assignments.map((assignment) => {
                  const rec = assignment.recommendation;
                  const isAccept = rec === "ACCEPT";
                  const isReject = rec === "REJECT";
                  return (
                    <tr key={assignment.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 leading-snug">{assignment.submission.title || "Untitled"}</div>
                        <div className="text-xs font-mono text-slate-500 mt-1">ID: {assignment.submission.submissionId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {assignment.submittedAt ? assignment.submittedAt.toLocaleDateString() : "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isAccept
                            ? "bg-emerald-100 text-emerald-800"
                            : isReject
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {rec ? rec.replace(/_/g, " ") : "N/A"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No completed reviews</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
              You haven&apos;t submitted any reviews yet. Assigned manuscripts will appear in your Active Reviews list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
