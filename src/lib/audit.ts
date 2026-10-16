import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function logAuditAction(action: string, details?: string, submissionId?: string) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    await prisma.auditLog.create({
      data: {
        action,
        details: details || null,
        userId: userId || null, // Will be null if called by system/unauthenticated
        submissionId: submissionId || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
