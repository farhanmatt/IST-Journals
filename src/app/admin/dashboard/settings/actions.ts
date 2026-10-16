"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAuditAction } from "@/lib/audit";

export async function updateSystemSettings(formData: FormData) {
  try {
    const keys = Array.from(formData.keys()).filter(k => !k.startsWith('$ACTION'));

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

    revalidatePath("/admin/dashboard/settings", "page");
    await logAuditAction("UPDATE_SYSTEM_SETTINGS", "Admin updated general system configuration");

    return { success: true, message: "System settings saved successfully." };
  } catch (error) {
    console.error("Error updating system settings:", error);
    return { success: false, message: "Failed to save settings." };
  }
}

export async function getSystemSettings() {
  const records = await prisma.journalSetting.findMany({
    where: {
      key: {
        in: [
          'systemMaintenanceMode',
          'systemTimezone',
          'allowRegistration',
          'requireEmailVerification',
          'maxUploadSize'
        ]
      }
    }
  });
  
  return records.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);
}
