import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { BookOpen, Plus, Eye } from "lucide-react";

export default async function IssuesPage() {
  const issues = await prisma.issue.findMany({
    orderBy: [{ year: "desc" }, { volume: "desc" }, { issueNumber: "desc" }],
    include: {
      _count: {
        select: { articles: true },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <BookOpen className="w-6 h-6 mr-3 text-indigo-600" />
            Issue Management
          </h1>
          <p className="text-slate-600 mt-2">
            Create, manage, and publish journal issues.
          </p>
        </div>
        <Link 
          href="/admin/dashboard/publication/issues/create"
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Issue</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Issue</th>
                <th scope="col" className="px-6 py-4 font-semibold">Year</th>
                <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                <th scope="col" className="px-6 py-4 font-semibold text-center">Articles</th>
                <th scope="col" className="px-6 py-4 font-semibold">Published Date</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {issues.length > 0 ? (
                issues.map((issue) => (
                  <tr key={issue.id} className="bg-white border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      Vol. {issue.volume}, No. {issue.issueNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {issue.year}
                    </td>
                    <td className="px-6 py-4">
                      {issue.status === "PUBLISHED" ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">Published</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold">Draft</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">
                      {issue._count.articles}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {issue.publishedAt ? format(new Date(issue.publishedAt), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/dashboard/publication/issues/${issue.id}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <BookOpen className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="font-medium text-slate-900">No issues found</p>
                      <p className="text-sm mt-1">Create your first issue to start publishing articles.</p>
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