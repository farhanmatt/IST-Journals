export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { SubmitWizard } from "./SubmitWizard";

export default async function SubmitManuscriptPage() {
  // Using queryRaw to bypass Next.js PrismaClient memory cache issues for newly added models
  const sections = await prisma.$queryRaw<any[]>`SELECT id, name FROM "Section" WHERE status = true ORDER BY name ASC`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Submit New Manuscript</h1>
        <p className="text-slate-600">Complete the submission wizard to send your manuscript for editorial review.</p>
      </div>
      
      <SubmitWizard sections={sections} />
    </div>
  );
}
