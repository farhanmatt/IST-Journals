"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendPasswordNotificationEmail } from "@/lib/mail";

export async function createUser(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const isActive = formData.get("isActive") === "true";
    
    // Roles could be multiple, so we extract all keys starting with "role_"
    const roles: string[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith("role_") && value === "true") {
        roles.push(key.replace("role_", ""));
      }
    });

    if (!name || !email || !password || roles.length === 0) {
      return { success: false, error: "Please fill in all required fields and select at least one role." };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "A user with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        isActive,
        roles: {
          create: roles.map((r) => ({ role: r as any })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: `Created new user: ${user.name}`,
        userId: user.id,
      }
    });

    revalidatePath("/admin/dashboard/users");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message || "An error occurred while creating the user." };
  }
}

export async function updateRolePermissions(role: string, permissions: string[]) {
  try {
    // Delete existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { role: role as any }
    });

    // Insert new permissions
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map(p => ({
          role: role as any,
          permission: p
        }))
      });
    }

    await prisma.auditLog.create({
      data: {
        action: `Updated permissions for role: ${role}`,
      }
    });

    revalidatePath("/admin/dashboard/users/roles");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating permissions:", error);
    return { success: false, error: "Failed to update permissions." };
  }
}

export async function changeUserPassword(userId: string, newPassword: string, sendEmail: boolean = true) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.roles?.includes("ADMIN")) {
      return { success: false, error: "Unauthorized. Admin privileges are required." };
    }

    if (!userId || !newPassword) {
      return { success: false, error: "User ID and new password are required." };
    }

    if (newPassword.trim().length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    // Verify user exists and check roles
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!targetUser) {
      return { success: false, error: "User not found." };
    }

    // Strict rule: Do not allow changing password for users with the Author role
    const isAuthor = targetUser.roles.some((r) => r.role === "AUTHOR");
    if (isAuthor) {
      return { success: false, error: "Password changes are disabled for users with the Author role." };
    }

    const cleanPassword = newPassword.trim();
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    // Update only the selected user
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Optionally send credentials to the user's Gmail
    let emailSent = false;
    let emailError: string | undefined = undefined;

    if (sendEmail && targetUser.email) {
      const emailResult = await sendPasswordNotificationEmail({
        to: targetUser.email,
        userName: targetUser.name || "User",
        newPassword: cleanPassword,
        adminName: session.user.name || session.user.email || "System Administrator",
        roles: targetUser.roles.map((r) => r.role),
      });

      emailSent = emailResult.success;
      emailError = emailResult.error;
    }

    await prisma.auditLog.create({
      data: {
        action: `Admin (${session.user.name || session.user.email}) changed password for user: ${targetUser.name} (${targetUser.email}). Email sent: ${emailSent ? "Yes" : "No"}${emailError ? ` (${emailError})` : ""}`,
        userId: session.user.id,
      },
    });

    revalidatePath("/admin/dashboard/users");

    return { 
      success: true, 
      emailSent,
      emailError,
      recipientEmail: targetUser.email,
    };
  } catch (error: any) {
    console.error("Error changing user password:", error);
    return { success: false, error: error.message || "Failed to change user password." };
  }
}
