"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function verifyAuthor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

export async function submitAuthorRevision(submissionId: string, data: {
  responseToReviewers: string;
}) {
  try {
    const user = await verifyAuthor();

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        title: true,
        authorId: true,
        status: true,
        handlingEditorId: true,
        files: {
          where: { type: "MANUSCRIPT" },
          orderBy: { version: "desc" },
          take: 1
        },
        revisions: {
          orderBy: { versionNumber: "desc" },
          take: 1
        }
      }
    });

    if (!submission) {
      return { success: false, error: "Submission not found." };
    }

    if (submission.authorId !== user.id) {
      return { success: false, error: "Unauthorized: You do not own this submission." };
    }

    if (submission.status !== "REVISION_REQUIRED") {
      return { success: false, error: "This manuscript is not currently in 'Revision Required' status." };
    }

    const latestManuscript = submission.files[0];
    const highestRevision = submission.revisions[0];
    const nextVersion = Math.max(
      (latestManuscript?.version || 1),
      (highestRevision?.versionNumber || 1) + 1
    );

    const revisionId = 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

    // Create revision record
    await prisma.$executeRaw`
      INSERT INTO "Revision" (id, "submissionId", "versionNumber", "responseToReviewers", "createdAt")
      VALUES (
        ${revisionId},
        ${submissionId},
        ${nextVersion},
        ${data.responseToReviewers || null},
        NOW()
      )
    `;

    // Update submission status to REVISION_SUBMITTED
    await prisma.$executeRaw`
      UPDATE "Submission"
      SET status = 'REVISION_SUBMITTED'::"SubmissionStatus", "updatedAt" = NOW()
      WHERE id = ${submissionId}
    `;

    // Create Audit Log
    try {
      await prisma.$executeRaw`
        INSERT INTO "AuditLog" (id, "userId", "submissionId", action, "createdAt")
        VALUES ('c' || extract(epoch from now())::text, ${user.id}, ${submissionId}, ${`Author submitted revision v${nextVersion}`}, NOW())
      `;
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    // Notify handling editor or editorial staff
    try {
      if (submission.handlingEditorId) {
        await prisma.notification.create({
          data: {
            userId: submission.handlingEditorId,
            submissionId,
            title: "Revised Manuscript Submitted",
            message: `Author has submitted revision (v${nextVersion}) for "${submission.title}".`,
            isRead: false
          }
        });
      } else {
        // Find editors to notify
        const editors = await prisma.user.findMany({
          where: { roles: { some: { role: "EDITOR" } }, isActive: true },
          select: { id: true },
          take: 3
        });
        for (const ed of editors) {
          await prisma.notification.create({
            data: {
              userId: ed.id,
              submissionId,
              title: "Revised Manuscript Submitted",
              message: `Author has submitted revision (v${nextVersion}) for "${submission.title}".`,
              isRead: false
            }
          });
        }
      }
    } catch (notifErr) {
      console.warn("Editor notification notice:", notifErr);
    }

    revalidatePath('/author', 'layout');
    revalidatePath('/editor', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error("Submit revision error:", error);
    return { success: false, error: error.message };
  }
}
