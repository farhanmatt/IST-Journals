export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SubmissionsTable } from "../../components/SubmissionsTable";

export default async function DecisionsPage() {
  await getServerSession(authOptions);

  const submissions = await prisma.submission.findMany({
    where: { 
      status: { in: ["REVIEWS_COMPLETED", "REVISION_SUBMITTED"] }
    },
    orderBy: { updatedAt: "asc" },
    include: { author: { select: { name: true } } }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Editorial Decisions</h1>
        <p className="text-slate-500">Manuscripts that require an editorial decision.</p>
      </div>
      <SubmissionsTable submissions={submissions} emptyMessage="No manuscripts pending decision." />
    </div>
  );
}

