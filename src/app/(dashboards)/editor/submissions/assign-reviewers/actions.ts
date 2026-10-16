"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function assignReviewer(submissionId: string, reviewerId: string, dueDate: Date) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Not authenticated");
    
    // Fetch submission to inspect status
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, status: true }
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    // Check for duplicate or prior assignments
    const existing = await prisma.reviewerAssignment.findFirst({
      where: { submissionId, reviewerId },
      orderBy: { createdAt: "desc" }
    });
    
    if (existing) {
      if (existing.status === "INVITED" || existing.status === "ACCEPTED") {
        throw new Error("This reviewer already has an active or pending invitation for this manuscript.");
      }
      if (existing.status === "SUBMITTED" && submission.status !== "REVISION_SUBMITTED") {
        throw new Error("This reviewer has already submitted a review for this manuscript. Re-invitation is only allowed when a revision has been submitted.");
      }
    }

    const assignmentId = 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    
    await prisma.$executeRaw`
      INSERT INTO "ReviewerAssignment" (id, "submissionId", "reviewerId", status, "dueDate", "createdAt", "updatedAt")
      VALUES (
        ${assignmentId},
        ${submissionId},
        ${reviewerId},
        'INVITED'::"ReviewStatus",
        ${dueDate},
        NOW(),
        NOW()
      )
    `;

    // Update submission status to UNDER_REVIEW and link handlingEditorId
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        handlingEditorId: session.user.id,
        status: "UNDER_REVIEW",
      }
    });

    revalidatePath('/editor', 'layout');
    revalidatePath('/reviewer', 'layout');
    
    return { success: true };
  } catch (error: any) {
    console.error("Assign reviewer error:", error);
    return { success: false, error: error.message };
  }
}
