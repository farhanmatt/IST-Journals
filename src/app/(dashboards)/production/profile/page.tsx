export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductionEditorProfileClient } from "./ProductionEditorProfileClient";

export default async function ProductionEditorProfilePage() {
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
  if (!userRoles.includes("PRODUCTION_EDITOR") && !userRoles.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  let assignedCount = 0;
  let completedCount = 0;

  try {
    if (prisma?.productionAssignment) {
      [assignedCount, completedCount] = await Promise.all([
        prisma.productionAssignment.count({
          where: { productionEditorId: user.id },
        }),
        prisma.productionAssignment.count({
          where: {
            productionEditorId: user.id,
            status: "COMPLETED",
          },
        }),
      ]);
    }
  } catch (err) {
    console.warn("Failed to query production counts in profile:", err);
  }

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

  return <ProductionEditorProfileClient user={formattedUser} stats={stats} />;
}
