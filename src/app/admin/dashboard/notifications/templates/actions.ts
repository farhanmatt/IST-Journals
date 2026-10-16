"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAuditAction } from "@/lib/audit";

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

const TEMPLATES_KEY = "emailTemplates";

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const setting = await prisma.journalSetting.findUnique({
      where: { key: TEMPLATES_KEY },
    });
    if (!setting || !setting.value) return [];
    return JSON.parse(setting.value) as EmailTemplate[];
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return [];
  }
}

export async function saveEmailTemplates(templates: EmailTemplate[]) {
  try {
    await prisma.journalSetting.upsert({
      where: { key: TEMPLATES_KEY },
      update: { value: JSON.stringify(templates) },
      create: { key: TEMPLATES_KEY, value: JSON.stringify(templates) },
    });
    
    revalidatePath("/admin/dashboard/notifications/templates");
    
    await logAuditAction("UPDATE_EMAIL_TEMPLATES", "Admin updated automated email templates");

    return { success: true, message: "Email templates saved successfully." };
  } catch (error) {
    console.error("Error saving email templates:", error);
    return { success: false, message: "Failed to save templates." };
  }
}
