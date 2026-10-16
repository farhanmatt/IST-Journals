import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Bell, Check, Clock } from "lucide-react";

export default async function EditorNotificationsPage() {
  const session = await getServerSession(authOptions);
  
  const notifications = await prisma.notification.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Notifications</h1>
          <p className="text-slate-500">System alerts and workflow updates.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {notifications.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {notifications.map(notification => (
              <li key={notification.id} className={`p-4 hover:bg-slate-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''}`}>
                <div className="flex items-start space-x-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{notification.message}</p>
                    <div className="flex items-center space-x-2 mt-2 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{notification.createdAt.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
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
