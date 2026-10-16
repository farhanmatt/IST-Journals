"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function verifyProductionEditor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");
  
  if (!session.user.roles.includes("PRODUCTION_EDITOR") && !session.user.roles.includes("ADMIN")) {
    throw new Error("Not authorized");
  }
  return session.user;
}

export async function saveProductionProgress(
  submissionId: string,
  data: { checklist: any; notes: string; metadata: any }
) {
  try {
    const user = await verifyProductionEditor();

    // Find the assignment
    const assignment = await prisma.productionAssignment.findUnique({
      where: {
        submissionId_productionEditorId: {
          submissionId,
          productionEditorId: user.id,
        },
      },
    });

    if (!assignment && !user.roles.includes("ADMIN")) {
      return { success: false, error: "Assignment not found for this user." };
    }

    const currentStatus = assignment?.status || "ASSIGNED";
    const nextStatus = currentStatus === "ASSIGNED" ? "IN_PROGRESS" : currentStatus;

    if (assignment) {
      await prisma.productionAssignment.update({
        where: { id: assignment.id },
        data: {
          checklist: data.checklist,
          notes: data.notes,
          metadata: data.metadata,
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
        action: "Production progress saved: checklist and metadata updated",
      },
    });

    revalidatePath("/production", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Save production progress error:", error);
    return { success: false, error: error.message };
  }
}

export async function submitToEditorForFinalApproval(
  submissionId: string,
  data: { checklist?: any; notes?: string; metadata?: any }
) {
  try {
    const user = await verifyProductionEditor();

    // Verify assignment exists
    const assignment = await prisma.productionAssignment.findUnique({
      where: {
        submissionId_productionEditorId: {
          submissionId,
          productionEditorId: user.id,
        },
      },
    });

    if (!assignment && !user.roles.includes("ADMIN")) {
      return { success: false, error: "Assignment not found." };
    }

    // Verify manuscript has at least one PRODUCTION_READY_PDF file
    const productionPdf = await prisma.submissionFile.findFirst({
      where: {
        submissionId,
        type: "PRODUCTION_READY_PDF",
      },
    });

    if (!productionPdf) {
      return { 
        success: false, 
        error: "Please upload at least one final publication PDF (Production-Ready PDF) before submitting for approval." 
      };
    }

    // Validate required checklist items
    const cl = data.checklist || (assignment?.checklist as any) || {};
    const requiredChecklistKeys = [
      "layoutFormatting",
      "headingsHierarchy",
      "tablesFiguresHighRes",
      "citationsReferencesStyle",
      "pageNumbersRunningHeaders",
      "metadataAndDoiVerified",
      "finalPdfProofGenerated",
    ];

    const uncompleted = requiredChecklistKeys.filter(k => !cl[k]);
    if (uncompleted.length > 0) {
      return {
        success: false,
        error: "All quality checklist items must be checked off before submitting for final approval.",
      };
    }

    if (assignment) {
      await prisma.productionAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "SUBMITTED_FOR_APPROVAL",
          checklist: data.checklist || assignment.checklist,
          notes: data.notes !== undefined ? data.notes : assignment.notes,
          metadata: data.metadata || assignment.metadata,
          updatedAt: new Date(),
        },
      });
    }

    // Update submission status to PENDING_FINAL_APPROVAL
    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: "PENDING_FINAL_APPROVAL",
        updatedAt: new Date(),
      },
      select: { handlingEditorId: true, title: true, submissionId: true },
    });

    const auditMessage = data.notes 
      ? `Final production files submitted to Editor for final approval by ${user.name || user.email}: ${data.notes}` 
      : `Final production files submitted to Editor for final approval by ${user.name || user.email}`;

    // Add audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        submissionId,
        action: auditMessage,
      },
    });

    // Notify handling editor
    if (submission?.handlingEditorId) {
      await prisma.notification.create({
        data: {
          userId: submission.handlingEditorId,
          submissionId,
          title: "Final Production Files Ready for Approval",
          message: `Production Editor ${user.name || user.email} has completed galleys and metadata for "${submission.title || 'manuscript'}". Ready for your final approval & publication.`,
          isRead: false,
        },
      });
    }

    // Also notify Journal Managers and Editors
    const editorsAndManagers = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { in: ["JOURNAL_MANAGER", "EDITOR", "ADMIN"] }
          }
        }
      },
      select: { id: true }
    });

    for (const em of editorsAndManagers) {
      if (em.id !== submission?.handlingEditorId && em.id !== user.id) {
        await prisma.notification.create({
          data: {
            userId: em.id,
            submissionId,
            title: "Pending Final Approval: Production Ready",
            message: `Manuscript "${submission?.title || 'manuscript'}" is pending final editorial approval.`,
            isRead: false,
          },
        }).catch(() => null);
      }
    }

    revalidatePath("/production", "layout");
    revalidatePath("/editor", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Submit for final approval error:", error);
    return { success: false, error: error.message };
  }
}

export async function completeProductionWork(
  submissionId: string,
  data: { checklist?: any; notes?: string; metadata?: any }
) {
  return submitToEditorForFinalApproval(submissionId, data);
}

export async function deleteProductionFile(submissionId: string, fileId: string) {
  try {
    const user = await verifyProductionEditor();

    // Verify assignment is not completed
    const assignment = await prisma.productionAssignment.findUnique({
      where: {
        submissionId_productionEditorId: {
          submissionId,
          productionEditorId: user.id,
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
        type: { in: ["PRODUCTION_READY_PDF", "PRODUCTION_READY_HTML", "SUPPLEMENTARY"] },
      },
    });

    if (!file) {
      return { success: false, error: "Production file not found." };
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
        action: `Deleted production file: ${file.originalName} (${file.type})`,
      },
    });

    revalidatePath("/production", "layout");
    revalidatePath("/editor", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Delete production file error:", error);
    return { success: false, error: error.message };
  }
}
