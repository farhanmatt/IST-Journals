"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, ArrowRight, Inbox, Clock, CheckCircle2, PlayCircle } from "lucide-react";

interface AssignmentItem {
  id: string;
  submissionId: string;
  manuscriptDbId: string;
  title: string;
  authorName: string;
  journalName: string;
  assignedAt: string;
  dueDate: string | null;
  status: string;
  submissionStatus?: string;
}

export function AssignedManuscriptsClient({ 
  initialAssignments,
  filterStatus = "ALL"
}: { 
  initialAssignments: AssignmentItem[];
  filterStatus?: "ALL" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
}) {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>(filterStatus);

  const filtered = initialAssignments.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.submissionId.toLowerCase().includes(search.toLowerCase()) ||
      item.authorName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = 
      selectedStatus === "ALL" ? true : item.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, ID, or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {filterStatus === "ALL" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSIGNED">Pending / Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Submission ID</th>
                  <th className="py-3.5 px-4">Manuscript Title</th>
                  <th className="py-3.5 px-4">Journal Name</th>
                  <th className="py-3.5 px-4">Assigned Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item) => {
                  const statusFormatted = item.status.replace(/_/g, " ");

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-xs text-slate-900 whitespace-nowrap">
                        {item.submissionId}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          href={`/production/assigned/${item.manuscriptDbId}`}
                          className="font-medium text-slate-900 hover:text-indigo-600 line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">Author: {item.authorName}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {item.journalName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {new Date(item.assignedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        {item.dueDate ? (
                          <span
                            className={
                              new Date(item.dueDate) < now && item.status !== "COMPLETED"
                                ? "text-rose-600 font-semibold"
                                : "text-slate-600"
                            }
                          >
                            {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No deadline</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item.submissionStatus === "PUBLISHED" || item.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.submissionStatus === "PENDING_FINAL_APPROVAL" || item.status === "SUBMITTED_FOR_APPROVAL"
                              ? "bg-indigo-100 text-indigo-800"
                              : item.submissionStatus === "PRODUCTION_CORRECTIONS_REQUIRED" || item.status === "CORRECTIONS_REQUIRED"
                              ? "bg-amber-100 text-amber-800"
                              : item.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {item.submissionStatus ? item.submissionStatus.replace(/_/g, " ") : statusFormatted}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {item.submissionStatus === "PRODUCTION_CORRECTIONS_REQUIRED" || item.status === "CORRECTIONS_REQUIRED" ? (
                          <Link
                            href={`/production/assigned/${item.manuscriptDbId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                          >
                            <span>Make Corrections</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : item.submissionStatus === "PENDING_FINAL_APPROVAL" || item.status === "SUBMITTED_FOR_APPROVAL" ? (
                          <Link
                            href={`/production/assigned/${item.manuscriptDbId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-200"
                          >
                            <span>Pending Approval</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : item.status === "ASSIGNED" ? (
                          <Link
                            href={`/production/assigned/${item.manuscriptDbId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                          >
                            <span>Start Production</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : item.status === "IN_PROGRESS" ? (
                          <Link
                            href={`/production/assigned/${item.manuscriptDbId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                          >
                            <span>Continue Production</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href={`/production/assigned/${item.manuscriptDbId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            <span>View Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <p className="text-slate-800 font-semibold mb-1">No manuscripts match criteria</p>
            <p className="text-slate-500 text-xs">
              Try adjusting your search query or filter options.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
