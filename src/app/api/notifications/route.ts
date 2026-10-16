import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Returns recent notifications for the logged-in user and current unread count.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          submission: {
            select: {
              id: true,
              submissionId: true,
              title: true,
              status: true
            }
          }
        }
      }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    return NextResponse.json({
      notifications,
      unreadCount
    });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Marks a specific notification or all notifications as read/unread.
 */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const body = await request.json().catch(() => ({}));
    const { id, isRead = true, markAllAsRead } = body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
    } else if (id && typeof id === "string") {
      await prisma.notification.updateMany({
        where: { id, userId },
        data: { isRead: Boolean(isRead) }
      });
    } else {
      return NextResponse.json(
        { error: "Provide a valid notification id or markAllAsRead flag" },
        { status: 400 }
      );
    }

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return NextResponse.json({
      success: true,
      unreadCount
    });
  } catch (error: any) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update notification status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Deletes a single notification or clears all read notifications.
 */
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.notification.deleteMany({
        where: { id, userId }
      });
    } else {
      // Clear all read notifications for this user
      await prisma.notification.deleteMany({
        where: { userId, isRead: true }
      });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return NextResponse.json({
      success: true,
      unreadCount
    });
  } catch (error: any) {
    console.error("DELETE /api/notifications error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete notifications" },
      { status: 500 }
    );
  }
}
