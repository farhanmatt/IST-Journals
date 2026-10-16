import prisma from "@/lib/prisma";
import { SubmissionsTable } from "@/components/admin/SubmissionsTable";
import { UploadCloud } from "lucide-react";

export default async function ArticlesProductionPage() {
  const submissions = await prisma.submission.findMany({
    where: {
      status: {
        in: ["COPYEDITING", "PRODUCTION", "SCHEDULED"]
      }
    },
    orderBy: { updatedAt: "desc" },
    include: {
      author: {
        select: { name: true }
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <UploadCloud className="w-6 h-6 mr-3 text-indigo-600" />
          Articles in Production
        </h1>
        <p className="text-slate-600 mt-2">
          Manage manuscripts that have been accepted and are undergoing copyediting, typesetting, or are scheduled for publication.
        </p>
      </div>
      <SubmissionsTable 
        title="Production Queue"
        description="Articles being finalized before official publication."
        submissions={submissions}
      />
    </div>
  );
}