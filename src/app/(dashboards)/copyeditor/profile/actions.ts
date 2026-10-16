"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export interface UpdateProfileInput {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    name: string;
    email: string;
  };
}

export async function updateReviewerProfile(data: UpdateProfileInput): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please log in again." };
    }

    const userId = session.user.id;

    // Validate name
    const trimmedName = data.name?.trim();
    if (!trimmedName) {
      return { success: false, error: "Full Name is required." };
    }

    // Validate email
    const trimmedEmail = data.email?.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: "Email address is required." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    // Check if user exists in database
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return { success: false, error: "Reviewer profile not found in database." };
    }

    // If email is changing, check if another user already uses this email
    if (trimmedEmail !== currentUser.email.toLowerCase()) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email: trimmedEmail,
          NOT: { id: userId },
        },
      });

      if (emailTaken) {
        return { success: false, error: "This email address is already in use by another account." };
      }
    }

    const updateData: { name: string; email: string; passwordHash?: string } = {
      name: trimmedName,
      email: trimmedEmail,
    };

    // If new password is provided
    if (data.newPassword && data.newPassword.trim().length > 0) {
      const newPassword = data.newPassword.trim();
      const currentPassword = data.currentPassword?.trim();
      const confirmPassword = data.confirmPassword?.trim();

      if (!currentPassword) {
        return { success: false, error: "Please provide your current password to set a new password." };
      }

      if (newPassword.length < 6) {
        return { success: false, error: "New password must be at least 6 characters long." };
      }

      if (newPassword !== confirmPassword) {
        return { success: false, error: "New password and confirmation password do not match." };
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isPasswordValid) {
        return { success: false, error: "Current password is incorrect." };
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      updateData.passwordHash = newPasswordHash;
    }

    // Update user in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/reviewer/profile");
    revalidatePath("/reviewer/dashboard");

    return {
      success: true,
      message: "Profile updated successfully!",
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
      },
    };
  } catch (error: any) {
    console.error("Error updating reviewer profile:", error);
    return {
      success: false,
      error: error?.message || "An unexpected error occurred while saving profile changes.",
    };
  }
}
