export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bell, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/date";

export default async function ReviewerNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
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
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Reviewer Notifications</h1>
          <p className="text-slate-500 text-sm">Review invitations, round updates, and editorial communications.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {notifications.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const text = (notification.title + " " + notification.message).toLowerCase();
              const targetUrl = text.includes("invitation")
                ? "/reviewer/invitations"
                : notification.submissionId
                ? `/reviewer/assigned/${notification.submissionId}`
                : "/reviewer/assigned";

              return (
                <li
                  key={notification.id}
                  className={`p-5 hover:bg-slate-50 transition-colors ${
                    !notification.isRead ? "bg-indigo-50/40" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        !notification.isRead ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm ${
                            !notification.isRead
                              ? "font-bold text-slate-900"
                              : "font-medium text-slate-700"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <span className="text-xs text-slate-400 flex items-center shrink-0">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {formatDateTime(notification.createdAt)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between pt-1 text-xs">
                        {notification.submission?.submissionId && (
                          <span className="font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            ID: {notification.submission.submissionId}
                          </span>
                        )}

                        <Link
                          href={targetUrl}
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <span>{text.includes("invitation") ? "View Invitations" : "View Assignment"}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-slate-500 font-medium">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
