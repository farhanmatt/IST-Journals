export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Inbox,
  Edit,
  Download
} from "lucide-react";
import { formatDateTime } from "@/lib/date";

export default async function EditorCopyeditingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const submissions = await prisma.submission.findMany({
    where: {
      status: "COPYEDITING"
    },
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { name: true, email: true } },
      files: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Copyediting</h1>
        <p className="text-slate-500">
          Manuscripts currently undergoing language editing, styling, and formatting with the Copy Editor.
        </p>
      </div>

      {submissions.length > 0 ? (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const copyeditedFiles = sub.files.filter(f => f.type === "COPYEDITED_FILE");

            return (
              <div 
                key={sub.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-slate-300 transition-all"
              >
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {sub.submissionId}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Edit className="w-3 h-3 mr-1" />
                        In Copyediting
                      </span>
                      {copyeditedFiles.length > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {copyeditedFiles.length} Copyedited File(s)
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 pt-1">{sub.title || "Untitled"}</h2>
                    <p className="text-xs text-slate-500">
                      Author: <span className="font-medium text-slate-700">{sub.author?.name}</span> ({sub.author?.email}) • Last updated: {new Date(sub.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <Link
                      href={`/editor/submissions/${sub.id}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <span>View Manuscript</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>

                {copyeditedFiles.length > 0 && (
                  <div className="p-4 bg-emerald-50/40 border-t border-emerald-100">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                      Submitted Copyedited Files
                    </h4>
                    <div className="space-y-2">
                      {copyeditedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-emerald-200 text-xs">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <span className="font-medium text-slate-900">{file.originalName}</span>
                            <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB) • Uploaded on {formatDateTime(file.createdAt)}</span>
                          </div>
                          <a 
                            href={file.url} 
                            download 
                            target="_blank" 
                            className="inline-flex items-center text-emerald-700 hover:text-emerald-900 font-semibold"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No manuscripts in copyediting</h3>
          <p className="text-slate-500">There are currently no manuscripts in the copyediting stage.</p>
        </div>
      )}
    </div>
  );
}
