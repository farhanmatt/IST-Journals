"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function verifyEditor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");
  
  if (!session.user.roles.includes("EDITOR") && !session.user.roles.includes("ADMIN")) {
    throw new Error("Not authorized");
  }
  return session.user;
}

export async function updateSubmissionStatus(id: string, newStatus: string) {
  try {
    const user = await verifyEditor();
    
    await prisma.$executeRaw`
      UPDATE "Submission"
      SET 
        status = ${newStatus}::"SubmissionStatus",
        "handlingEditorId" = COALESCE("handlingEditorId", ${user.id}),
        "updatedAt" = NOW()
      WHERE id = ${id}
    `;
    
    // Log audit
    await prisma.$executeRaw`
      INSERT INTO "AuditLog" (id, "userId", "submissionId", action, "createdAt")
      VALUES ('c' || extract(epoch from now())::text, ${user.id}, ${id}, 'Status changed to ' || ${newStatus}, NOW())
    `;

    revalidatePath('/editor', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error("Status update error:", error);
    return { success: false, error: error.message };
  }
}

export async function submitEditorialDecision(id: string, data: any) {
  try {
    const user = await verifyEditor();
    
    // Using explicit SQL for EditorialDecision
    const decisionId = 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    
    await prisma.$executeRaw`
      INSERT INTO "EditorialDecision" (id, "submissionId", "editorId", decision, "commentsForAuthor", "internalComments", "createdAt")
      VALUES (
        ${decisionId},
        ${id},
        ${user.id},
        ${data.decision}::"DecisionType",
        ${data.commentsForAuthor || null},
        ${data.internalComments || null},
        NOW()
      )
    `;

    // Map Decision to Status
    let newStatus = "";
    if (data.decision === "ACCEPT") newStatus = "ACCEPTED";
    else if (data.decision === "MINOR_REVISION" || data.decision === "MAJOR_REVISION") newStatus = "REVISION_REQUIRED";
    else if (data.decision === "REJECT") newStatus = "REJECTED";
    else if (data.decision === "DESK_REJECT") newStatus = "DESK_REJECTED";

    if (newStatus) {
      await prisma.$executeRaw`
        UPDATE "Submission"
        SET status = ${newStatus}::"SubmissionStatus", "updatedAt" = NOW()
        WHERE id = ${id}
      `;
    }

    // Log audit
    await prisma.$executeRaw`
      INSERT INTO "AuditLog" (id, "userId", "submissionId", action, "createdAt")
      VALUES ('c' || extract(epoch from now())::text, ${user.id}, ${id}, 'Editorial decision recorded: ' || ${data.decision}, NOW())
    `;

    // Notify author of editorial decision
    try {
      const submission = await prisma.submission.findUnique({
        where: { id },
        select: { authorId: true, title: true }
      });

      if (submission) {
        let notifTitle = "";
        let notifMsg = "";
        if (data.decision === "MINOR_REVISION") {
          notifTitle = "Minor Revision Requested";
          notifMsg = `The editor has requested minor revisions for your manuscript "${submission.title}". Please check the editor instructions and reviewer feedback under your Revisions tab to submit an updated version.`;
        } else if (data.decision === "MAJOR_REVISION") {
          notifTitle = "Major Revision Requested";
          notifMsg = `The editor has requested major revisions for your manuscript "${submission.title}". Please review the detailed comments and submit a revised manuscript and rebuttal under Revisions.`;
        } else if (data.decision === "REJECT") {
          notifTitle = "Editorial Decision: Rejected";
          notifMsg = `An editorial decision has been recorded for your manuscript "${submission.title}": Rejected. Please check your decisions page for full feedback.`;
        } else if (data.decision === "DESK_REJECT") {
          notifTitle = "Editorial Decision: Desk Rejected";
          notifMsg = `Your manuscript "${submission.title}" has been desk rejected during initial screening.`;
        } else if (data.decision === "ACCEPT") {
          notifTitle = "Manuscript Accepted!";
          notifMsg = `Congratulations! Your manuscript "${submission.title}" has been officially accepted for publication.`;
        }

        if (notifTitle) {
          await prisma.notification.create({
            data: {
              userId: submission.authorId,
              submissionId: id,
              title: notifTitle,
              message: notifMsg,
              isRead: false
            }
          });
        }
      }
    } catch (notifErr) {
      console.warn("Author notification notice:", notifErr);
    }

    revalidatePath('/editor', 'layout');
    revalidatePath('/author', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error("Decision error:", error);
    return { success: false, error: error.message };
  }
}

export async function startNewReviewRound(
  submissionId: string, 
  data: { reviewerId: string; dueDate?: string; instructions?: string }
) {
  try {
    const user = await verifyEditor();
    const { reviewerId, dueDate, instructions } = data;

    if (!reviewerId) {
      return { success: false, error: "Please select a reviewer to assign for this review round." };
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, title: true, submissionId: true }
    });

    if (!submission) {
      return { success: false, error: "Submission not found." };
    }

    const calculatedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const assignmentId = 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    
    // Create new ReviewerAssignment for the new round
    await prisma.$executeRaw`
      INSERT INTO "ReviewerAssignment" (id, "submissionId", "reviewerId", status, "dueDate", "createdAt", "updatedAt")
      VALUES (
        ${assignmentId},
        ${submissionId},
        ${reviewerId},
        'INVITED'::"ReviewStatus",
        ${calculatedDueDate},
        NOW(),
        NOW()
      )
    `;

    // Update submission status to UNDER_REVIEW
    await prisma.$executeRaw`
      UPDATE "Submission"
      SET status = 'UNDER_REVIEW'::"SubmissionStatus", "updatedAt" = NOW()
      WHERE id = ${submissionId}
    `;

    // Send notification to reviewer
    try {
      await prisma.notification.create({
        data: {
          userId: reviewerId,
          submissionId,
          title: "New Review Round Invitation",
          message: `You have been invited to review the revised manuscript for "${submission.title}". Due date: ${calculatedDueDate.toLocaleDateString()}.${instructions ? ` Note: ${instructions}` : ''}`,
          isRead: false
        }
      });
    } catch (notifErr) {
      console.warn("Reviewer round notification notice:", notifErr);
    }

    // Audit log
    try {
      await prisma.$executeRaw`
        INSERT INTO "AuditLog" (id, "userId", "submissionId", action, "createdAt")
        VALUES ('c' || extract(epoch from now())::text, ${user.id}, ${submissionId}, 'Started new review round', NOW())
      `;
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    revalidatePath('/editor', 'layout');
    revalidatePath('/reviewer', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error("New review round error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendToCopyediting(
  id: string, 
  data: { copyeditorId?: string; dueDate?: string; instructions?: string }
) {
  try {
    const user = await verifyEditor();
    const copyeditorId = data.copyeditorId;
    const instructions = data.instructions;
    const dueDate = data.dueDate ? new Date(data.dueDate) : null;

    // Update submission status and handling editor
    await prisma.submission.update({
      where: { id },
      data: {
        status: "COPYEDITING",
        handlingEditorId: user.id,
        updatedAt: new Date()
      }
    });

    // Create or update CopyeditorAssignment record if copyeditorId is specified
    if (copyeditorId) {
      await prisma.copyeditorAssignment.upsert({
        where: {
          submissionId_copyeditorId: {
            submissionId: id,
            copyeditorId
          }
        },
        update: {
          status: "ASSIGNED",
          dueDate,
          notes: instructions || null,
          updatedAt: new Date()
        },
        create: {
          submissionId: id,
          copyeditorId,
          status: "ASSIGNED",
          dueDate,
          notes: instructions || null
        }
      });

      // Fetch submission title for notification
      const submission = await prisma.submission.findUnique({
        where: { id },
        select: { title: true, submissionId: true }
      });

      // Send notification to the assigned copyeditor
      await prisma.notification.create({
        data: {
          userId: copyeditorId,
          submissionId: id,
          title: "New Copyediting Assignment",
          message: `You have been assigned to copyedit manuscript "${submission?.title || submission?.submissionId || 'manuscript'}" by Editor ${user.name || user.email}.${instructions ? ` Instructions: ${instructions}` : ''}`,
          isRead: false
        }
      });
    }

    const auditAction = instructions 
      ? `Assigned to Copyediting: ${instructions}` 
      : 'Assigned manuscript to Copyediting';

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        submissionId: id,
        action: auditAction
      }
    });

    revalidatePath('/editor', 'layout');
    revalidatePath('/copyeditor', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error("Send to copyediting error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendToProduction(
  id: string,
  options?: {
    productionEditorId?: string;
    dueDate?: string;
    instructions?: string;
  }
) {
  try {
    const user = await verifyEditor();
    const { productionEditorId, dueDate: dueDateStr, instructions } = options || {};

    const dueDate = dueDateStr ? new Date(dueDateStr) : null;

    // Transition submission status to PRODUCTION
    await prisma.$executeRaw`
      UPDATE "Submission"
      SET 
        status = 'PRODUCTION'::"SubmissionStatus",
        "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    if (productionEditorId) {
      await prisma.productionAssignment.upsert({
        where: {
          submissionId_productionEditorId: {
            submissionId: id,
            productionEditorId
          }
        },
        update: {
          status: "ASSIGNED",
          dueDate,
          notes: instructions || null,
          updatedAt: new Date()
        },
        create: {
          submissionId: id,
          productionEditorId,
          status: "ASSIGNED",
          dueDate,
          notes: instructions || null
        }
      });

      const submission = await prisma.submission.findUnique({
        where: { id },
        select: { title: true, submissionId: true }
      });

      await prisma.notification.create({
        data: {
          userId: productionEditorId,
          submissionId: id,
          title: "New Production Assignment",
          message: `You have been assigned to prepare publication files for manuscript "${submission?.title || submission?.submissionId || 'manuscript'}" by Editor ${user.name || user.email}.${instructions ? ` Instructions: ${instructions}` : ''}`,
          isRead: false
        }
      });
    }

    const auditAction = instructions 
      ? `Assigned to Production Editor: ${instructions}` 
      : 'Assigned manuscript to Production';

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        submissionId: id,
        action: auditAction
      }
    });

    revalidatePath('/editor', 'layout');
    revalidatePath('/production', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error("Send to production error:", error);
    return { success: false, error: error.message };
  }
}

export async function approveAndPublishArticle(
  id: string,
  data: {
    issueId: string;
    doi?: string;
    pageRange?: string;
    publishedAt?: string;
    notes?: string;
  }
) {
  try {
    const user = await verifyEditor();

    if (!data.issueId) {
      return { success: false, error: "Please select an issue to publish the article into." };
    }

    const issue = await prisma.issue.findUnique({
      where: { id: data.issueId },
    });

    if (!issue) {
      return { success: false, error: "Selected issue does not exist." };
    }

    const pubDate = data.publishedAt ? new Date(data.publishedAt) : new Date();

    // 1. Upsert PublishedArticle
    const published = await prisma.publishedArticle.upsert({
      where: { submissionId: id },
      update: {
        issueId: data.issueId,
        doi: data.doi || null,
        pageRange: data.pageRange || null,
        publishedAt: pubDate,
      },
      create: {
        submissionId: id,
        issueId: data.issueId,
        doi: data.doi || null,
        pageRange: data.pageRange || null,
        publishedAt: pubDate,
      },
    });

    // 2. Update Submission status to PUBLISHED
    const submission = await prisma.submission.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        updatedAt: new Date(),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        productionAssignments: { select: { productionEditorId: true } },
      },
    });

    // 3. Mark ProductionAssignment COMPLETED
    await prisma.productionAssignment.updateMany({
      where: { submissionId: id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 4. Audit Log
    const auditText = data.doi 
      ? `Article approved and published in Vol ${issue.volume} No ${issue.issueNumber} (DOI: ${data.doi})` 
      : `Article approved and published in Vol ${issue.volume} No ${issue.issueNumber}`;

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        submissionId: id,
        action: auditText,
      },
    });

    // 5. Notify Author
    if (submission.author?.id) {
      await prisma.notification.create({
        data: {
          userId: submission.author.id,
          submissionId: id,
          title: "Your Manuscript Has Been Published!",
          message: `Congratulations! Your manuscript "${submission.title}" has been published in Vol. ${issue.volume}, No. ${issue.issueNumber} (${issue.year}).`,
          isRead: false,
        },
      });
    }

    // 6. Notify Production Editor(s)
    for (const pa of submission.productionAssignments) {
      if (pa.productionEditorId) {
        await prisma.notification.create({
          data: {
            userId: pa.productionEditorId,
            submissionId: id,
            title: "Production Approved: Article Published",
            message: `Editor ${user.name || user.email} has approved your production files and published "${submission.title}".`,
            isRead: false,
          },
        }).catch(() => null);
      }
    }

    revalidatePath('/editor', 'layout');
    revalidatePath('/production', 'layout');
    revalidatePath('/author', 'layout');
    revalidatePath('/', 'layout');
    return { success: true, publishedArticleId: published.id };
  } catch (error: any) {
    console.error("Approve and publish error:", error);
    return { success: false, error: error.message };
  }
}

export async function requestProductionCorrections(
  id: string,
  data: { correctionNotes: string }
) {
  try {
    const user = await verifyEditor();

    if (!data.correctionNotes || !data.correctionNotes.trim()) {
      return { success: false, error: "Please provide correction instructions for the Production Editor." };
    }

    // 1. Update Submission status to PRODUCTION_CORRECTIONS_REQUIRED
    const submission = await prisma.submission.update({
      where: { id },
      data: {
        status: "PRODUCTION_CORRECTIONS_REQUIRED",
        updatedAt: new Date(),
      },
      include: {
        productionAssignments: { select: { productionEditorId: true } },
      },
    });

    // 2. Update ProductionAssignment status to CORRECTIONS_REQUIRED and record notes
    await prisma.productionAssignment.updateMany({
      where: { submissionId: id },
      data: {
        status: "CORRECTIONS_REQUIRED",
        notes: data.correctionNotes.trim(),
        updatedAt: new Date(),
      },
    });

    // 3. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        submissionId: id,
        action: `Production corrections requested: ${data.correctionNotes.trim()}`,
      },
    });

    // 4. Notify Production Editor(s)
    for (const pa of submission.productionAssignments) {
      if (pa.productionEditorId) {
        await prisma.notification.create({
          data: {
            userId: pa.productionEditorId,
            submissionId: id,
            title: "Production Corrections Requested",
            message: `Editor ${user.name || user.email} reviewed manuscript "${submission.title}" and requested corrections: "${data.correctionNotes.trim()}". Please revise the galleys and re-submit for final approval.`,
            isRead: false,
          },
        });
      }
    }

    revalidatePath('/editor', 'layout');
    revalidatePath('/production', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error("Request production corrections error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendManuscriptToAuthor(
  id: string,
  options?: { decision?: string; commentsForAuthor?: string; internalComments?: string }
) {
  try {
    const user = await verifyEditor();

    // Fetch submission with latest reviewer assignment to determine default recommendation if not passed
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        reviewerAssignments: {
          where: { status: "SUBMITTED" },
          orderBy: { submittedAt: "desc" },
          take: 1
        }
      }
    });

    if (!submission) {
      return { success: false, error: "Submission not found." };
    }

    const latestReview = submission.reviewerAssignments[0];
    const decision = options?.decision || latestReview?.recommendation || "MINOR_REVISION";
    const commentsForAuthor = options?.commentsForAuthor || latestReview?.commentsForAuthor || null;
    const internalComments = options?.internalComments || null;

    return await submitEditorialDecision(id, {
      decision,
      commentsForAuthor,
      internalComments
    });
  } catch (error: any) {
    console.error("sendManuscriptToAuthor error:", error);
    return { success: false, error: error.message };
  }
}



