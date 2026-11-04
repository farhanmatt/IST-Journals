export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bell, Clock, ArrowRight, CheckCircle2, AlertCircle, FileText, Inbox } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/date";

export default async function AuthorNotificationsPage() {
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
            {unreadCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200/80">
                {unreadCount} new
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                All caught up
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Editorial decisions, review reports, and updates on your submitted manuscripts.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
        {notifications.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const text = (notification.title + " " + notification.message).toLowerCase();
              let targetUrl = "/author/submissions";
              const isRevision = text.includes("revision") || notification.submission?.status === "REVISION_REQUIRED";
              const isDecision = text.includes("accept") || text.includes("reject") || text.includes("decision");

              if (notification.submissionId) {
                if (isRevision) {
                  targetUrl = `/author/revisions?id=${notification.submissionId}`;
                } else if (text.includes("reject") || text.includes("decision") || notification.submission?.status === "REJECTED") {
                  targetUrl = "/author/decisions";
                }
              }

              return (
                <li
                  key={notification.id}
                  className={`p-5 sm:p-6 hover:bg-slate-50/80 transition-all duration-150 ${
                    !notification.isRead ? "bg-blue-50/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-0.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-2xs ${
                        !notification.isRead
                          ? "bg-blue-600 text-white border-blue-500 shadow-glow"
                          : isRevision
                          ? "bg-amber-50 text-amber-600 border-amber-200/80"
                          : isDecision
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200/80"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {isRevision ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : isDecision ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Bell className="w-5 h-5" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`text-sm sm:text-base leading-snug ${
                              !notification.isRead
                                ? "font-bold text-slate-900"
                                : "font-semibold text-slate-700"
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                          )}
                        </div>
                        <span className="text-xs text-slate-400 flex items-center shrink-0">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {formatDateTime(notification.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 whitespace-pre-wrap leading-relaxed">
                        {notification.message}
                      </p>

                      {(notification.submission || notification.submissionId) && (
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          {notification.submission?.submissionId && (
                            <span className="font-mono font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                              ID: {notification.submission.submissionId}
                            </span>
                          )}

                          {notification.submissionId && (
                            <Link
                              href={targetUrl}
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-bold group ml-auto transition-colors"
                            >
                              <span>View Manuscript</span>
                              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No notifications yet</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
              When an editor or reviewer sends feedback or makes a decision on your submission, you&apos;ll be notified right here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
