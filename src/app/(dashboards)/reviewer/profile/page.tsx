export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReviewerProfileClient } from "./ReviewerProfileClient";

export default async function ReviewerProfilePage() {
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

  // Ensure user has REVIEWER or ADMIN role
  const userRoles = user.roles.map((r) => r.role);
  if (!userRoles.includes("REVIEWER") && !userRoles.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const [invitations, activeAssignments, completedReviews] = await Promise.all([
    prisma.reviewerAssignment.count({
      where: { reviewerId: user.id, status: "INVITED" },
    }),
    prisma.reviewerAssignment.count({
      where: { reviewerId: user.id, status: "ACCEPTED" },
    }),
    prisma.reviewerAssignment.count({
      where: { reviewerId: user.id, status: "SUBMITTED" },
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
    invitations,
    activeAssignments,
    completedReviews,
  };

  return <ReviewerProfileClient user={formattedUser} stats={stats} />;
}
