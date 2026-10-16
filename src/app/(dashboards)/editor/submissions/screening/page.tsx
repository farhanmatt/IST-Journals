export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SubmissionsTable } from "../../components/SubmissionsTable";

export default async function ScreeningPage() {
  await getServerSession(authOptions);

  const submissions = await prisma.submission.findMany({
    where: { status: "INITIAL_SCREENING" },
    orderBy: { updatedAt: "asc" },
    include: { author: { select: { name: true } } }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Initial Screening</h1>
        <p className="text-slate-500">Manuscripts pending editor screening before peer review.</p>
      </div>
      <SubmissionsTable submissions={submissions} emptyMessage="No manuscripts pending screening." />
    </div>
  );
}

