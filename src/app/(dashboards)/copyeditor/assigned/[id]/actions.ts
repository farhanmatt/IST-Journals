"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function verifyCopyEditor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");
  
  if (!session.user.roles.includes("COPYEDITOR") && !session.user.roles.includes("ADMIN")) {
    throw new Error("Not authorized");
  }
  return session.user;
}

export async function saveCopyeditProgress(
  submissionId: string,
  data: { checklist: any; notes: string }
) {
  try {
    const user = await verifyCopyEditor();

    // Find the assignment
    const assignment = await prisma.copyeditorAssignment.findUnique({
      where: {
        submissionId_copyeditorId: {
          submissionId,
          copyeditorId: user.id,
        },
      },
    });

    if (!assignment && !user.roles.includes("ADMIN")) {
      return { success: false, error: "Assignment not found for this user." };
    }

    const currentStatus = assignment?.status || "ASSIGNED";
    const nextStatus = currentStatus === "ASSIGNED" ? "IN_PROGRESS" : currentStatus;

    if (assignment) {
      await prisma.copyeditorAssignment.update({
        where: { id: assignment.id },
        data: {
          checklist: data.checklist,
          notes: data.notes,
          status: nextStatus,
          updatedAt: new Date(),
        },
      });
    }

    // Add Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        submissionId,
        action: "Copyediting progress saved: checklist updated",
      },
    });

    revalidatePath("/copyeditor", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Save progress error:", error);
    return { success: false, error: error.message };
  }
}

export async function completeCopyeditingWork(
  submissionId: string,
  data: { checklist?: any; notes?: string }
) {
  try {
    const user = await verifyCopyEditor();

    // Verify assignment exists and is not already completed
    const assignment = await prisma.copyeditorAssignment.findUnique({
      where: {
        submissionId_copyeditorId: {
          submissionId,
          copyeditorId: user.id,
        },
      },
    });

    if (!assignment && !user.roles.includes("ADMIN")) {
      return { success: false, error: "Assignment not found." };
    }

    if (assignment?.status === "COMPLETED") {
      return { success: false, error: "Copyediting has already been marked as completed." };
    }

    // Verify manuscript has at least one copyedited file
    const copyeditedFile = await prisma.submissionFile.findFirst({
      where: {
        submissionId,
        type: "COPYEDITED_FILE",
      },
    });

    if (!copyeditedFile) {
      return { 
        success: false, 
        error: "Please upload at least one edited manuscript file before completing copyediting." 
      };
    }

    // Validate required checklist items
    const cl = data.checklist || (assignment?.checklist as any) || {};
    const requiredChecklistKeys = [
      "grammarSpelling",
      "punctuationClarity",
      "headingsFormatting",
      "referencesCitations",
      "tablesFiguresCaptions",
      "journalGuidelines",
      "fileUploaded",
    ];

    const uncompleted = requiredChecklistKeys.filter(k => !cl[k]);
    if (uncompleted.length > 0) {
      return {
        success: false,
        error: "All checklist items must be marked as completed before finalizing.",
      };
    }

    if (assignment) {
      await prisma.copyeditorAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          checklist: data.checklist || assignment.checklist,
          notes: data.notes !== undefined ? data.notes : assignment.notes,
          updatedAt: new Date(),
        },
      });
    }

    const auditMessage = data.notes 
      ? `Copyediting completed by ${user.name || user.email}: ${data.notes}` 
      : `Copyediting completed by ${user.name || user.email}`;

    // Add audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        submissionId,
        action: auditMessage,
      },
    });

    // Touch submission updatedAt
    await prisma.submission.update({
      where: { id: submissionId },
      data: { updatedAt: new Date() },
    });

    // Find handling editor to notify
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { handlingEditorId: true, title: true, submissionId: true },
    });

    if (submission?.handlingEditorId) {
      await prisma.notification.create({
        data: {
          userId: submission.handlingEditorId,
          submissionId,
          title: "Copyediting Completed",
          message: `Copyediting has been completed for "${submission.title || 'manuscript'}". Copyedited files are ready for your review.`,
          isRead: false,
        },
      });
    }

    revalidatePath("/copyeditor", "layout");
    revalidatePath("/editor", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Complete copyediting error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCopyeditedFile(submissionId: string, fileId: string) {
  try {
    const user = await verifyCopyEditor();

    // Verify assignment is not completed
    const assignment = await prisma.copyeditorAssignment.findUnique({
      where: {
        submissionId_copyeditorId: {
          submissionId,
          copyeditorId: user.id,
        },
      },
    });

    if (assignment?.status === "COMPLETED") {
      return { success: false, error: "Cannot delete files for completed assignments." };
    }

    const file = await prisma.submissionFile.findFirst({
      where: {
        id: fileId,
        submissionId,
        type: "COPYEDITED_FILE",
      },
    });

    if (!file) {
      return { success: false, error: "Copyedited file not found." };
    }

    if (file.uploaderId !== user.id && !user.roles.includes("ADMIN")) {
      return { success: false, error: "You can only delete files you uploaded." };
    }

    await prisma.submissionFile.delete({
      where: { id: fileId },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        submissionId,
        action: `Deleted copyedited file: ${file.originalName} (v${file.version})`,
      },
    });

    revalidatePath("/copyeditor", "layout");
    revalidatePath("/editor", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Delete copyedited file error:", error);
    return { success: false, error: error.message };
  }
}
