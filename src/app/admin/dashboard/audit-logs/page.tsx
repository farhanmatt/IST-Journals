import prisma from "@/lib/prisma";
import { ShieldAlert } from "lucide-react";
import { AuditLogsClient } from "./AuditLogsClient";

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500, // Limit to recent 500 logs for performance
    include: {
      user: { select: { name: true, email: true } },
      submission: { select: { submissionId: true, title: true } },
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <ShieldAlert className="w-6 h-6 mr-3 text-rose-600" />
          Audit Logs
        </h1>
        <p className="text-slate-600 mt-2">
          Comprehensive, unalterable record of system events, configuration changes, and manuscript lifecycle actions.
        </p>
      </div>

      <AuditLogsClient logs={logs} />
    </div>
  );
}