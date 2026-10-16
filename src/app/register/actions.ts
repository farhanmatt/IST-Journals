"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    if (!name || !email || !password) {
      return { success: false, error: "Please fill in all required fields." };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "A user with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Default to AUTHOR role for public registrations
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        roles: {
          create: [{ role: "AUTHOR" }]
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error registering user:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
