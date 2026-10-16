import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User, Mail, Calendar, Shield } from "lucide-react";

export default async function EditorProfilePage() {
  const session = await getServerSession(authOptions);
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { roles: true }
  });

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">My Profile</h1>
        <p className="text-slate-500">Manage your personal information and editorial roles.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Full Name</label>
                <div className="flex items-center space-x-2 text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{user.name}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Email Address</label>
                <div className="flex items-center space-x-2 text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Member Since</label>
                <div className="flex items-center space-x-2 text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{user.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Active Roles</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.roles.map(r => (
                    <span key={r.id} className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase rounded-full border border-blue-100">
                      <Shield className="w-3 h-3" />
                      <span>{r.role.replace(/_/g, ' ')}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
