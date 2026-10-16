import prisma from "@/lib/prisma";
import { SubmissionsTable } from "@/components/admin/SubmissionsTable";

export default async function RevisionsPage() {
  const submissions = await prisma.submission.findMany({
    where: {
      status: {
        in: ["REVISION_REQUIRED", "REVISION_SUBMITTED"]
      }
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { name: true }
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Revisions</h1>
      </div>
      <SubmissionsTable 
        title="Revision Management"
        description="Manuscripts that have been sent back to authors for revision or recently resubmitted."
        submissions={submissions}
      />
    </div>
  );
}