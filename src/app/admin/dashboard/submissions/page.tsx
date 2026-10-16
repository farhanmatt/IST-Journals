import prisma from "@/lib/prisma";
import { SubmissionsTable } from "@/components/admin/SubmissionsTable";

export default async function AllSubmissionsPage() {
  const submissions = await prisma.submission.findMany({
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
        <h1 className="text-2xl font-bold text-slate-900">All Submissions</h1>
      </div>
      <SubmissionsTable 
        title="Submission Archive"
        description="A complete list of all manuscripts submitted to the journal across all statuses."
        submissions={submissions}
      />
    </div>
  );
}