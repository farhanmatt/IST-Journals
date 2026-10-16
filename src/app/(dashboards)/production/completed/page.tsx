export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AssignedManuscriptsClient } from "../assigned/AssignedManuscriptsClient";

export default async function ProductionCompletedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const journalSetting = await prisma.journalSetting.findFirst({
    where: { key: "journalName" }
  }).catch(() => null);
  const journalName = journalSetting?.value || "IST Journals";

  const assignments = prisma?.productionAssignment
    ? await prisma.productionAssignment.findMany({
        where: { 
          productionEditorId: session.user.id,
          status: "COMPLETED"
        },
        orderBy: { completedAt: "desc" },
        include: {
          submission: {
            select: {
              id: true,
              submissionId: true,
              title: true,
              status: true,
              author: { select: { name: true } },
            }
          }
        }
      })
    : [];

  const formattedAssignments = assignments.map((a) => ({
    id: a.id,
    submissionId: a.submission.submissionId,
    manuscriptDbId: a.submission.id,
    title: a.submission.title || "Untitled Manuscript",
    authorName: a.submission.author?.name || "Unknown Author",
    journalName,
    assignedAt: a.assignedAt.toISOString(),
    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
    status: a.status,
    submissionStatus: a.submission.status,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Completed Production</h1>
        <p className="text-slate-500 text-sm">
          Manuscripts where publication-ready files and metadata have been finalized.
        </p>
      </div>

      <AssignedManuscriptsClient 
        initialAssignments={formattedAssignments} 
        filterStatus="COMPLETED" 
      />
    </div>
  );
}
