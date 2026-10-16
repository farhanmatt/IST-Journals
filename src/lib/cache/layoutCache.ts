import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export const getCachedUnreadNotificationCount = (userId: string) =>
  unstable_cache(
    async () => {
      try {
        return await prisma.notification.count({
          where: { userId, isRead: false }
        });
      } catch {
        return 0;
      }
    },
    [`unread-notifs-${userId}`],
    { revalidate: 30, tags: ["notifications", `notifications-${userId}`] }
  )();

export const getCachedReviewerCounts = (userId: string) =>
  unstable_cache(
    async () => {
      try {
        const [pendingInvitations, unreadNotifs] = await Promise.all([
          prisma.reviewerAssignment.count({
            where: { reviewerId: userId, status: "INVITED" }
          }).catch(() => 0),
          prisma.notification.count({
            where: { userId, isRead: false }
          }).catch(() => 0)
        ]);
        return { pendingInvitations, unreadNotifs };
      } catch {
        return { pendingInvitations: 0, unreadNotifs: 0 };
      }
    },
    [`reviewer-layout-${userId}`],
    { revalidate: 30, tags: ["notifications", "reviewer-counts", `reviewer-${userId}`] }
  )();

export const getCachedCopyeditorCounts = (userId: string) =>
  unstable_cache(
    async () => {
      try {
        const [assigned, unread] = await Promise.all([
          prisma.copyeditorAssignment ? prisma.copyeditorAssignment.count({
            where: { copyeditorId: userId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } }
          }).catch(() => 0) : Promise.resolve(0),
          prisma.notification ? prisma.notification.count({
            where: { userId, isRead: false }
          }).catch(() => 0) : Promise.resolve(0)
        ]);
        return { assignedCount: assigned, unreadNotifs: unread };
      } catch {
        return { assignedCount: 0, unreadNotifs: 0 };
      }
    },
    [`copyeditor-layout-${userId}`],
    { revalidate: 30, tags: ["notifications", "copyeditor-counts", `copyeditor-${userId}`] }
  )();

export const getCachedProductionCounts = (userId: string) =>
  unstable_cache(
    async () => {
      try {
        const [assigned, unread] = await Promise.all([
          prisma.productionAssignment ? prisma.productionAssignment.count({
            where: { 
              productionEditorId: userId, 
              status: { in: ["ASSIGNED", "IN_PROGRESS"] } 
            }
          }).catch(() => 0) : Promise.resolve(0),
          prisma.notification ? prisma.notification.count({
            where: { userId, isRead: false }
          }).catch(() => 0) : Promise.resolve(0)
        ]);
        return { assignedCount: assigned, unreadNotifs: unread };
      } catch {
        return { assignedCount: 0, unreadNotifs: 0 };
      }
    },
    [`production-layout-${userId}`],
    { revalidate: 30, tags: ["notifications", "production-counts", `production-${userId}`] }
  )();
