"use server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitReview(assignmentId: string, data: { recommendation: string; commentsForAuthor: string; commentsForEditor: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated. Please log in." };
    }

    const assignment = await prisma.reviewerAssignment.findFirst({
      where: { id: assignmentId, reviewerId: session.user.id },
      include: { submission: true }
    });

    if (!assignment) {
      return { success: false, error: "Review assignment not found or access denied." };
    }

    if (!data.recommendation) {
      return { success: false, error: "Please select an evaluation recommendation." };
    }

    if (!data.commentsForAuthor?.trim()) {
      return { success: false, error: "Comments for the author are required." };
    }

    // 1. Update the reviewer assignment record
    await prisma.reviewerAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        recommendation: data.recommendation as any,
        commentsForAuthor: data.commentsForAuthor.trim(),
        commentsForEditor: data.commentsForEditor?.trim() || "",
      }
    });

    // 2. Update the manuscript status (REJECTED for reject, REVIEWS_COMPLETED for others)
    const isReject = data.recommendation === "REJECT";
    await prisma.submission.update({
      where: { id: assignment.submissionId },
      data: {
        status: isReject ? "REJECTED" : "REVIEWS_COMPLETED",
        updatedAt: new Date(),
      }
    });

    // If rejected, record editorial decision and notify author immediately
    if (isReject) {
      let editorId = assignment.submission.handlingEditorId;
      if (!editorId) {
        const firstEditor = await prisma.userRole.findFirst({
          where: { role: { in: ["EDITOR", "ADMIN"] } },
          select: { userId: true }
        });
        editorId = firstEditor?.userId || session.user.id;
      }

      const decisionId = 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
      try {
        await prisma.$executeRaw`
          INSERT INTO "EditorialDecision" (id, "submissionId", "editorId", decision, "commentsForAuthor", "createdAt")
          VALUES (
            ${decisionId},
            ${assignment.submissionId},
            ${editorId},
            'REJECT'::"DecisionType",
            ${data.commentsForAuthor?.trim() || null},
            NOW()
          )
        `;
      } catch (decErr) {
        console.warn("Editorial decision record notice:", decErr);
      }

      try {
        await prisma.notification.create({
          data: {
            userId: assignment.submission.authorId,
            submissionId: assignment.submissionId,
            title: "Manuscript Decision: Rejected",
            message: `Following peer review, your manuscript "${assignment.submission.title}" has been rejected. Reviewer feedback is available on your decisions page.`,
            isRead: false
          }
        });
      } catch (notifErr) {
        console.warn("Author rejection notification notice:", notifErr);
      }
    }

    // 3. Log audit notification
    try {
      await prisma.$executeRaw`
        INSERT INTO "AuditLog" (id, "userId", "submissionId", action, "createdAt")
        VALUES ('c' || extract(epoch from now())::text, ${session.user.id}, ${assignment.submissionId}, ${isReject ? 'Review submitted: Manuscript rejected' : 'Review submitted'}, NOW())
      `;
    } catch (auditErr) {
      console.warn("Audit log insert failed:", auditErr);
    }

    // 4. Create Notification for handling editor or editors
    try {
      const recFormatted = data.recommendation.replace(/_/g, " ");
      const submissionTitle = assignment.submission.title || "Manuscript";
      const reviewerName = session.user.name || "A reviewer";

      if (assignment.submission.handlingEditorId) {
        await prisma.notification.create({
          data: {
            userId: assignment.submission.handlingEditorId,
            submissionId: assignment.submissionId,
            title: `Review Submitted: ${recFormatted}`,
            message: `${reviewerName} has submitted a review report with recommendation "${recFormatted}" for "${submissionTitle}".${isReject ? ' The manuscript has been marked as Rejected.' : ''}`,
            isRead: false
          }
        });
      } else {
        const editors = await prisma.userRole.findMany({
          where: { role: { in: ["EDITOR", "ADMIN"] } },
          select: { userId: true },
          take: 5
        });
        for (const ed of editors) {
          await prisma.notification.create({
            data: {
              userId: ed.userId,
              submissionId: assignment.submissionId,
              title: `Review Submitted: ${recFormatted}`,
              message: `${reviewerName} has submitted a review report with recommendation "${recFormatted}" for "${submissionTitle}".${isReject ? ' The manuscript has been marked as Rejected.' : ''}`,
              isRead: false
            }
          });
        }
      }
    } catch (notifErr) {
      console.warn("Review submission notification notice:", notifErr);
    }

    // 5. Revalidate all relevant cache paths across Editor, Reviewer, and Author dashboards
    revalidatePath("/reviewer", "layout");
    revalidatePath("/editor", "layout");
    revalidatePath("/author", "layout");

    return { 
      success: true, 
      message: "Review submitted successfully! The editor has been notified." 
    };
  } catch (error: any) {
    console.error("Error submitting review:", error);
    return { 
      success: false, 
      error: error?.message || "Failed to submit review." 
    };
  }
}
