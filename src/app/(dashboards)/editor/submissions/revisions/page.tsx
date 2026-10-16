export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SubmissionsTable } from "../../components/SubmissionsTable";

export default async function RevisionsPage() {
  await getServerSession(authOptions);

  const submissions = await prisma.submission.findMany({
    where: { 
      status: { in: ["REVISION_SUBMITTED", "REVISION_REQUIRED"] } 
    },
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } } }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Revisions</h1>
        <p className="text-slate-500">Revised manuscripts submitted by authors.</p>
      </div>
      <SubmissionsTable submissions={submissions} emptyMessage="No revised manuscripts found." />
    </div>
  );
}

