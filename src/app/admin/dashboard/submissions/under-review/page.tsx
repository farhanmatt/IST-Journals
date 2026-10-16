import prisma from "@/lib/prisma";
import { SubmissionsTable } from "@/components/admin/SubmissionsTable";

export default async function UnderReviewSubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    where: {
      status: {
        in: ["UNDER_REVIEW", "REVIEWS_COMPLETED"]
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
        <h1 className="text-2xl font-bold text-slate-900">Under Review</h1>
      </div>
      <SubmissionsTable 
        title="Active Reviews"
        description="Manuscripts currently assigned to reviewers or awaiting editorial decisions after review."
        submissions={submissions}
      />
    </div>
  );
}