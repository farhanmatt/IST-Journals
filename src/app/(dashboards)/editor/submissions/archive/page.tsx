export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SubmissionsTable } from "../../components/SubmissionsTable";

export default async function ArchivePage({ searchParams }: { searchParams: { tab?: string } }) {
  await getServerSession(authOptions);
  
  const currentTab = searchParams.tab === "rejected" ? "REJECTED" : "ACCEPTED";

  const submissions = await prisma.submission.findMany({
    where: { 
      status: currentTab === "REJECTED" ? { in: ["REJECTED", "DESK_REJECTED"] } : "ACCEPTED" 
    },
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } } }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Archived Submissions</h1>
          <p className="text-slate-500">Accepted and rejected manuscripts.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <a 
            href="?tab=accepted" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentTab === "ACCEPTED" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            Accepted
          </a>
          <a 
            href="?tab=rejected" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentTab === "REJECTED" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            Rejected
          </a>
        </div>
      </div>

      <SubmissionsTable 
        submissions={submissions} 
        emptyMessage={`No ${currentTab.toLowerCase().replace('_', ' ')} manuscripts found.`} 
      />
    </div>
  );
}

