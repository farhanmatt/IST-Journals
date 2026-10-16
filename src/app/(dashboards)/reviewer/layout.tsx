import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReviewerSidebarClient } from "./components/ReviewerSidebarClient";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCachedReviewerCounts } from "@/lib/cache/layoutCache";

export default async function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!session.user.roles.includes("REVIEWER") && !session.user.roles.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const { pendingInvitations, unreadNotifs } = await getCachedReviewerCounts(session.user.id);

  return (
    <DashboardShell
      sidebar={<ReviewerSidebarClient user={session.user} />}
      portalName="Reviewer Panel"
      notificationsHref="/reviewer/notifications"
      profileHref="/reviewer/profile"
      unreadCount={unreadNotifs || pendingInvitations}
      hasUnread={(unreadNotifs || pendingInvitations) > 0}
      mainClassName="p-4 sm:p-6 lg:p-8"
    >
      {children}
    </DashboardShell>
  );
}
