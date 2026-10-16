import prisma from "@/lib/prisma";
import { SubmissionsTable } from "@/components/admin/SubmissionsTable";

export default async function AcceptedSubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    where: {
      status: {
        in: ["ACCEPTED", "COPYEDITING", "PRODUCTION", "SCHEDULED", "PUBLISHED"]
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
        <h1 className="text-2xl font-bold text-slate-900">Accepted Submissions</h1>
      </div>
      <SubmissionsTable 
        title="Production Queue"
        description="Manuscripts that have been accepted and are moving through copyediting and production."
        submissions={submissions}
      />
    </div>
  );
}