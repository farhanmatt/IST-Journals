"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type JournalSection = {
  id: string;
  name: string;
  policy: string;
  peerReviewed: boolean;
  openAccess: boolean;
};

export async function getJournalSections(): Promise<JournalSection[]> {
  try {
    const setting = await prisma.journalSetting.findUnique({
      where: { key: "journalSections" },
    });
    if (!setting || !setting.value) return [];
    return JSON.parse(setting.value) as JournalSection[];
  } catch (error) {
    console.error("Error fetching sections:", error);
    return [];
  }
}

export async function saveJournalSections(sections: JournalSection[]) {
  try {
    await prisma.journalSetting.upsert({
      where: { key: "journalSections" },
      update: { value: JSON.stringify(sections) },
      create: { key: "journalSections", value: JSON.stringify(sections) },
    });
    
    revalidatePath("/admin/dashboard/journal/sections");
    return { success: true, message: "Sections saved successfully." };
  } catch (error) {
    console.error("Error saving sections:", error);
    return { success: false, message: "Failed to save sections." };
  }
}
