import prisma from "@/lib/prisma";
import { SubmissionsTable } from "@/components/admin/SubmissionsTable";

export default async function RejectedSubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    where: {
      status: {
        in: ["REJECTED", "DESK_REJECTED"]
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
        <h1 className="text-2xl font-bold text-slate-900">Rejected Submissions</h1>
      </div>
      <SubmissionsTable 
        title="Rejected Archive"
        description="Manuscripts that were declined during initial screening or after peer review."
        submissions={submissions}
      />
    </div>
  );
}