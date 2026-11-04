export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import Link from "next/link";
import { FileSignature, Filter, Eye } from "lucide-react";
import { format } from "date-fns";

export default async function JournalManagerSubmissionsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const statusParam = searchParams?.status?.toUpperCase();

  let statusFilter: any = undefined;
  if (statusParam) {
    if (statusParam === "UNDER_REVIEW") {
      statusFilter = { in: ["UNDER_REVIEW", "REVIEWS_COMPLETED"] };
    } else if (statusParam === "REVISION_REQUIRED") {
      statusFilter = { in: ["REVISION_REQUIRED", "REVISION_SUBMITTED"] };
    } else if (statusParam === "REJECTED") {
      statusFilter = { in: ["REJECTED", "DESK_REJECTED"] };
    } else if (statusParam === "ACCEPTED") {
      statusFilter = { in: ["ACCEPTED", "COPYEDITING", "PRODUCTION", "SCHEDULED"] };
    } else {
      statusFilter = statusParam;
    }
  }

  const submissions = await prisma.submission.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { name: true, email: true },
      },
      section: {
        select: { name: true },
      },
    },
  });

  const filterTabs = [
    { label: "All", status: undefined },
    { label: "New", status: "SUBMITTED" },
    { label: "Under Review", status: "UNDER_REVIEW" },
    { label: "Revisions", status: "REVISION_REQUIRED" },
    { label: "Accepted", status: "ACCEPTED" },
    { label: "Rejected", status: "REJECTED" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <FileSignature className="w-7 h-7 mr-3 text-blue-600" />
            Submissions
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Review and track all submissions across the editorial workflow.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {filterTabs.map((tab) => {
              const isActive = (!statusParam && !tab.status) || (statusParam === tab.status);
              const href = tab.status ? `/journal-manager/submissions?status=${tab.status}` : "/journal-manager/submissions";
              return (
                <Link
                  key={tab.label}
                  href={href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-500"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {submissions.length} {submissions.length === 1 ? "submission" : "submissions"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Section</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No submissions found{statusParam ? ` for status ${statusParam.replace(/_/g, " ")}` : ""}.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700 text-xs whitespace-nowrap">
                      {sub.submissionId || sub.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 line-clamp-2 max-w-md">
                        {sub.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                      {sub.author?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {sub.section?.name || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 uppercase tracking-wider">
                        {sub.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {format(new Date(sub.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
