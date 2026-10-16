export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AssignedManuscriptsClient } from "../assigned/AssignedManuscriptsClient";

export default async function PendingCopyeditingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const journalSetting = await prisma.journalSetting.findFirst({
    where: { key: "journalName" }
  }).catch(() => null);
  const journalName = journalSetting?.value || "IST Journals";

  const assignments = await prisma.copyeditorAssignment.findMany({
    where: { copyeditorId: userId, status: "ASSIGNED" },
    orderBy: { assignedAt: "desc" },
    include: {
      submission: {
        include: {
          author: { select: { name: true, email: true } },
          section: { select: { name: true } },
        }
      }
    }
  });

  const formatted = assignments.map((a) => ({
    id: a.id,
    submissionId: a.submission.submissionId,
    manuscriptDbId: a.submission.id,
    title: a.submission.title || "Untitled Manuscript",
    authorName: a.submission.author?.name || "Unknown Author",
    journalName,
    assignedAt: a.assignedAt.toISOString(),
    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
    status: a.status,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Pending Copyediting</h1>
        <p className="text-slate-500 text-sm">
          Manuscripts assigned to you that are awaiting copyediting to begin.
        </p>
      </div>

      <AssignedManuscriptsClient initialAssignments={formatted} filterStatus="ASSIGNED" />
    </div>
  );
}
