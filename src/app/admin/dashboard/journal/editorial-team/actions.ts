"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role } from "@/generated/client";

const EDITORIAL_ROLES: Role[] = ["JOURNAL_MANAGER", "EDITOR", "SECTION_EDITOR"];

export async function getEditorialTeam() {
  const team = await prisma.userRole.findMany({
    where: {
      role: {
        in: EDITORIAL_ROLES,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    },
    orderBy: {
      role: 'asc'
    }
  });

  return team;
}

export async function searchUsersForTeam(query: string) {
  if (!query || query.length < 2) return [];
  
  return await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    take: 10,
  });
}

export async function addEditorialRole(userId: string, role: Role) {
  try {
    if (!EDITORIAL_ROLES.includes(role)) {
      throw new Error("Invalid editorial role");
    }

    await prisma.userRole.upsert({
      where: {
        userId_role: {
          userId,
          role,
        },
      },
      update: {},
      create: {
        userId,
        role,
      },
    });

    revalidatePath("/admin/dashboard/journal/editorial-team");
    revalidatePath("/"); // Update public landing page
    
    return { success: true, message: "Role assigned successfully." };
  } catch (error) {
    console.error("Error adding role:", error);
    return { success: false, message: "Failed to assign role." };
  }
}

export async function removeEditorialRole(userId: string, role: Role) {
  try {
    await prisma.userRole.delete({
      where: {
        userId_role: {
          userId,
          role,
        },
      },
    });

    revalidatePath("/admin/dashboard/journal/editorial-team");
    revalidatePath("/"); // Update public landing page

    return { success: true, message: "Role removed successfully." };
  } catch (error) {
    console.error("Error removing role:", error);
    return { success: false, message: "Failed to remove role." };
  }
}
