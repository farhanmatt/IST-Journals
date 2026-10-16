export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export default async function NewSubmissionsPage() {
  const session = await getServerSession(authOptions);

  const submissions = await prisma.submission.findMany({
    where: { status: "SUBMITTED" },
    orderBy: { updatedAt: "asc" }, // Oldest first
    include: {
      author: { select: { name: true, email: true } },
      section: { select: { name: true } }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">New Submissions</h1>
        <p className="text-slate-500">Manuscripts awaiting Initial Screening.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Submission ID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Section</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Submitted Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {submissions.length > 0 ? submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-700">{sub.submissionId}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 max-w-md truncate" title={sub.title}>{sub.title}</td>
                  <td className="px-6 py-4 text-slate-600">{sub.section?.name || "None"}</td>
                  <td className="px-6 py-4 text-slate-600">{sub.author.name}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {sub.updatedAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/editor/submissions/${sub.id}`} className="inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      Review <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No new submissions to review.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

