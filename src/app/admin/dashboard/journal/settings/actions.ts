"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAuditAction } from "@/lib/audit";

export async function updateJournalSettings(formData: FormData) {
  try {
    const keys = [
      "journalName",
      "tagline",
      "description",
      "publisher",
      "email",
      "phone",
      "issn",
    ];

    // Using a Prisma transaction to gracefully upsert each setting
    await prisma.$transaction(
      keys.map((key) => {
        const value = formData.get(key)?.toString() || "";
        return prisma.journalSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      })
    );

    // Revalidate the pages that depend on these settings
    revalidatePath("/admin/dashboard/journal/settings");
    revalidatePath("/"); // Update the public Landing Page

    await logAuditAction("UPDATE_JOURNAL_SETTINGS", "Admin updated core journal settings");

    return { success: true, message: "Settings saved successfully." };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { success: false, message: "An error occurred while saving settings." };
  }
}
