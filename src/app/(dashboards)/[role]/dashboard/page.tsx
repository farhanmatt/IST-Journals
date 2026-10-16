import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, LogOut } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function RoleDashboard({ params }: { params: { role: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Basic validation that user actually has this role (or ADMIN as fallback)
  const userRoles = session.user?.roles || [];
  const requestedRole = params.role.replace('-', '_').toUpperCase();
  
  if (!userRoles.includes(requestedRole) && !userRoles.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const roleDisplay = params.role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg text-slate-900">IST Journals</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 font-medium">
                Welcome, {session.user?.name}
              </span>
              <Link 
                href="/" 
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Back to Site
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-6">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {roleDisplay} Dashboard
          </h1>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Welcome to your dedicated workspace. Features and tools for your role will appear here.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
            <div className="p-6 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-1">My Profile</h3>
              <p className="text-sm text-slate-500">Manage your personal information and account settings.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-1">My Tasks</h3>
              <p className="text-sm text-slate-500">View your assigned manuscripts and pending actions.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-1">Resources</h3>
              <p className="text-sm text-slate-500">Access guidelines, templates, and helpful documentation.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
