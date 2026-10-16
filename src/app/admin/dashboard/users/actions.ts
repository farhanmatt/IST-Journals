"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

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
