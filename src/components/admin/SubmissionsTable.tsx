import Link from "next/link";
import { format } from "date-fns";
import { FileText, Eye, ArrowRight } from "lucide-react";
import { SubmissionStatus } from "@/generated/client";

type SubmissionWithAuthor = {
  id: string;
  submissionId: string;
  title: string;
  status: SubmissionStatus;
  createdAt: Date;
  author: {
    name: string;
  };
};

interface SubmissionsTableProps {
  title: string;
  description: string;
  submissions: SubmissionWithAuthor[];
}

const getStatusBadge = (status: SubmissionStatus) => {
  switch (status) {
    case "UNDER_REVIEW":
    case "REVIEWS_COMPLETED":
      return <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-xs font-semibold shadow-2xs">Under Review</span>;
    case "REVISION_REQUIRED":
    case "REVISION_SUBMITTED":
      return <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-xs font-semibold shadow-2xs">Revision</span>;
    case "ACCEPTED":
    case "COPYEDITING":
    case "PRODUCTION":
    case "SCHEDULED":
    case "PUBLISHED":
      return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-semibold shadow-2xs">Accepted</span>;
    case "REJECTED":
    case "DESK_REJECTED":
      return <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-xs font-semibold shadow-2xs">Rejected</span>;
    case "DRAFT":
      return <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200/80 rounded-full text-xs font-semibold shadow-2xs">Draft</span>;
    case "SUBMITTED":
    case "INITIAL_SCREENING":
    default:
      return <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full text-xs font-semibold shadow-2xs">New Submission</span>;
  }
};

export function SubmissionsTable({ title, description, submissions }: SubmissionsTableProps) {
  return (
    <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200/80 bg-slate-50/60">
        <h2 className="text-lg font-bold text-slate-900 flex items-center">
          <FileText className="w-5 h-5 mr-2.5 text-blue-600" />
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {description}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200/80 font-bold tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-4 font-bold">ID</th>
              <th scope="col" className="px-6 py-4 font-bold w-1/3">Title</th>
              <th scope="col" className="px-6 py-4 font-bold">Author</th>
              <th scope="col" className="px-6 py-4 font-bold">Status</th>
              <th scope="col" className="px-6 py-4 font-bold">Date</th>
              <th scope="col" className="px-6 py-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.length > 0 ? (
              submissions.map((sub) => (
                <tr key={sub.id} className="bg-white hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-mono font-semibold text-slate-700 text-xs whitespace-nowrap">
                    {sub.submissionId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">{sub.title}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium text-xs sm:text-sm whitespace-nowrap">
                    {sub.author.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(sub.status)}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                    {format(new Date(sub.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link 
                      href={`/admin/dashboard/submissions/${sub.id}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-bold text-xs sm:text-sm transition-colors py-1 px-2.5 rounded-lg hover:bg-blue-50"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 border border-slate-200">
                      <FileText className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-800 text-sm">No submissions found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">There are currently no submissions matching this criteria.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
