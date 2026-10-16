export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowRight, Clock } from "lucide-react";

export default async function AssignedManuscriptsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const assignments = await prisma.reviewerAssignment.findMany({
    where: { reviewerId: session.user.id, status: "ACCEPTED" },
    orderBy: { updatedAt: "desc" },
    include: { submission: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Active Review Assignments</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Manuscripts you have accepted and are actively evaluating.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/75 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Manuscript</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Review Deadline</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-xs sm:text-sm">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 leading-snug">{assignment.submission.title || "Untitled"}</div>
                      <div className="text-xs font-mono text-slate-500 mt-1">ID: {assignment.submission.submissionId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{assignment.dueDate ? assignment.dueDate.toLocaleDateString() : "No deadline set"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link 
                        href={`/reviewer/assigned/${assignment.submission.id}`} 
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-xs transition-colors"
                      >
                        <span>Open Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No active assignments</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
              You do not have any manuscripts to review at the moment. Pending requests can be reviewed under Invitations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
