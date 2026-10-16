"use server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function respondToInvitation(assignmentId: string, accept: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to respond to this invitation." };
    }

    const assignment = await prisma.reviewerAssignment.findFirst({
      where: { id: assignmentId, reviewerId: session.user.id }
    });

    if (!assignment) {
      return { success: false, error: "Review invitation not found or access denied." };
    }

    const newStatus = accept ? "ACCEPTED" : "DECLINED";

    await prisma.reviewerAssignment.update({
      where: { id: assignment.id },
      data: { status: newStatus }
    });

    try {
      await prisma.$executeRaw`
        INSERT INTO "AuditLog" (id, "userId", "submissionId", action, "createdAt")
        VALUES ('c' || extract(epoch from now())::text, ${session.user.id}, ${assignment.submissionId}, ${accept ? 'Reviewer accepted invitation' : 'Reviewer declined invitation'}, NOW())
      `;
    } catch (auditErr) {
      console.warn("Audit log insert failed:", auditErr);
    }

    revalidatePath("/reviewer/invitations");
    revalidatePath("/reviewer/assigned");
    revalidatePath("/reviewer/dashboard");

    return {
      success: true,
      message: accept 
        ? "Invitation accepted successfully! Opening review workspace..." 
        : "Invitation declined successfully."
    };
  } catch (error: any) {
    console.error("Error responding to invitation:", error);
    return {
      success: false,
      error: error?.message || "Failed to process invitation response."
    };
  }
}
