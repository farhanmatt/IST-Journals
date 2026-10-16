export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";

export default async function PublicArticlePdfPage({ params }: { params: { id: string } }) {
  const article = await prisma.publishedArticle.findFirst({
    where: {
      OR: [
        { id: params.id },
        { submissionId: params.id }
      ]
    },
    include: {
      issue: true,
      submission: {
        include: {
          files: true,
          author: true
        }
      }
    }
  });

  if (!article || !article.submission) {
    return notFound();
  }

  // Increment download count
  await prisma.publishedArticle.update({
    where: { id: article.id },
    data: { downloads: { increment: 1 } }
  }).catch(() => null);

  const pdfFile = article.submission.files.find(f => f.type === "PRODUCTION_READY_PDF")
    || article.submission.files.find(f => f.type === "MANUSCRIPT" && f.originalName.toLowerCase().endsWith(".pdf"));

  if (!pdfFile?.url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-md shadow-sm space-y-4">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h1 className="text-xl font-bold text-slate-800">PDF Proof Not Available</h1>
          <p className="text-sm text-slate-500">The PDF galley for this article has not been uploaded yet or is being prepared.</p>
          <Link href={'/article/' + article.id} className="inline-flex items-center text-sm text-blue-600 font-medium hover:underline">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Return to Article Abstract
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Top Bar */}
      <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Link
            href={'/article/' + article.id}
            className="inline-flex items-center text-xs font-medium text-slate-300 hover:text-white transition-colors bg-slate-700 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Article View
          </Link>
          <span className="text-sm font-semibold text-slate-200 truncate max-w-md hidden sm:inline">
            {article.submission.title}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={pdfFile.url}
            download={article.submission.title + '.pdf'}
            className="inline-flex items-center text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Download PDF
          </a>
          <a
            href={pdfFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-slate-300 hover:text-white px-2 py-1.5"
            title="Open in new window"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* PDF Embed Viewer */}
      <div className="flex-grow w-full h-[calc(100vh-56px)] bg-slate-950">
        <iframe
          src={pdfFile.url}
          className="w-full h-full border-0"
          title={article.submission.title}
        />
      </div>
    </div>
  );
}
