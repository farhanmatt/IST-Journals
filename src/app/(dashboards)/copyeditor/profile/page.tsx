export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CopyEditorProfileClient } from "./CopyEditorProfileClient";

export default async function CopyEditorProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });

  if (!user) {
    redirect("/login");
  }

  const userRoles = user.roles.map((r) => r.role);
  if (!userRoles.includes("COPYEDITOR") && !userRoles.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const [assignedCount, completedCount] = await Promise.all([
    prisma.submission.count({
      where: { status: "COPYEDITING" },
    }),
    prisma.submission.count({
      where: {
        files: {
          some: { type: "COPYEDITED_FILE" },
        },
      },
    }),
  ]);

  const formattedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    roles: userRoles,
  };

  const stats = {
    assignedCount,
    completedCount,
  };

  return <CopyEditorProfileClient user={formattedUser} stats={stats} />;
}
