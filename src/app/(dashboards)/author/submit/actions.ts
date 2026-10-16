"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveDraft(data: any, step: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.roles.includes("AUTHOR")) {
    return { success: false, error: "Unauthorized" };
  }

  const { id, title, abstract, keywords, sectionId } = data;

  try {
    if (id) {
      await prisma.$executeRaw`
        UPDATE "Submission" 
        SET 
          title = ${title || ""}, 
          abstract = ${abstract || null}, 
          keywords = ${keywords || null}, 
          "sectionId" = ${sectionId || null}, 
          "currentStep" = ${step},
          "updatedAt" = NOW()
        WHERE id = ${id} AND "authorId" = ${session.user.id}
      `;
      return { success: true, submissionId: id };
    } else {
      // Create new draft
      const year = new Date().getFullYear();
      
      // Use queryRaw to get count
      const result = await prisma.$queryRaw<any[]>`SELECT COUNT(*) FROM "Submission"`;
      const count = Number(result[0].count);
      
      const submissionIdString = `JMAS-${year}-${String(count + 1).padStart(4, "0")}`;

      // Generate a simple ID for Prisma since we are doing raw insert
      const newId = 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

      await prisma.$executeRaw`
        INSERT INTO "Submission" (id, "submissionId", title, abstract, keywords, "sectionId", "currentStep", status, "authorId", "updatedAt")
        VALUES (
          ${newId},
          ${submissionIdString},
          ${title || "Untitled Draft"},
          ${abstract || null},
          ${keywords || null},
          ${sectionId || null},
          ${step},
          'DRAFT',
          ${session.user.id},
          NOW()
        )
      `;
      return { success: true, submissionId: newId };
    }
  } catch (error: any) {
    console.error("Draft save error:", error);
    return { success: false, error: error.message || "Failed to save draft" };
  }
}

export async function submitManuscript(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.roles.includes("AUTHOR")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.$executeRaw`
      UPDATE "Submission"
      SET
        status = 'SUBMITTED',
        "currentStep" = 5,
        "updatedAt" = NOW()
      WHERE id = ${id} AND "authorId" = ${session.user.id}
    `;

    revalidatePath("/author/dashboard");
    revalidatePath("/author/submissions");
    
    return { success: true };
  } catch (error) {
    console.error("Submit error:", error);
    return { success: false, error: "Failed to submit manuscript" };
  }
}
