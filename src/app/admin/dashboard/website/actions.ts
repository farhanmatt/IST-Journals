"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAuditAction } from "@/lib/audit";
import { promises as fs } from "fs";
import path from "path";

export async function updateWebsiteSettings(formData: FormData) {
  try {
    const keys = Array.from(formData.keys()).filter(k => !k.startsWith('$ACTION'));
    const updates = [];

    for (const key of keys) {
      let value = formData.get(key);

      if (typeof value === "object" && value !== null && "size" in value && "type" in value) {
        // It's a File
        const file = value as File;
        if (file.size === 0) continue; // No new file selected, keep existing value

        if (!file.type.startsWith('image/')) {
          return { success: false, message: "Invalid file type. Only images are allowed." };
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          return { success: false, message: "File size exceeds 5MB limit." };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        
        try {
          await fs.access(uploadDir);
        } catch {
          await fs.mkdir(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);
        value = `/uploads/${fileName}`;
      } else {
        value = value?.toString() || "";
      }

      updates.push(
        prisma.journalSetting.upsert({
          where: { key },
          update: { value: value as string },
          create: { key, value: value as string },
        })
      );
    }

    await prisma.$transaction(updates);

    revalidatePath("/admin/dashboard/website", "layout");
    revalidatePath("/"); // Update public pages

    await logAuditAction("UPDATE_WEBSITE_SETTINGS", "Admin updated website settings/pages");

    return { success: true, message: "Settings saved successfully." };
  } catch (error) {
    console.error("Error updating website settings:", error);
    return { success: false, message: "Failed to save settings." };
  }
}

export async function getWebsiteSettings() {
  const records = await prisma.journalSetting.findMany();
  return records.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);
}
