export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bell, Clock } from "lucide-react";
import Link from "next/link";

export default async function ProductionNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });



  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Notifications</h1>
          <p className="text-slate-500 text-sm">Production assignment alerts and editorial updates.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {notifications.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => (
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
                            : "font-semibold text-slate-800"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">
                      {notification.message}
                    </p>
                    {notification.submissionId && (
                      <div className="mt-2.5">
                        <Link
                          href={`/production/assigned/${notification.submissionId}`}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
                        >
                          View Manuscript &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7" />
            </div>
            <p className="text-slate-800 font-semibold mb-1">No notifications yet</p>
            <p className="text-slate-500 text-xs">
              When an editor assigns a manuscript to you for production, you will receive an alert here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
