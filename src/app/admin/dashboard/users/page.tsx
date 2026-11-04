import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UsersTableClient } from "./UsersTableClient";

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: { role?: string };
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.roles?.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const roleParam = searchParams?.role?.toUpperCase();
  const validRoles = ["ADMIN", "EDITOR", "SECTION_EDITOR", "REVIEWER", "AUTHOR", "COPYEDITOR", "PRODUCTION_EDITOR", "READER", "JOURNAL_MANAGER"];
  const selectedRole = roleParam && validRoles.includes(roleParam) ? roleParam : undefined;

  const users = await prisma.user.findMany({
    where: selectedRole ? {
      roles: {
        some: {
          role: selectedRole as any,
        },
      },
    } : undefined,
    include: {
      roles: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Manage system users, assigned editorial roles, and platform permissions.
          </p>
        </div>
        <Link 
          href="/admin/dashboard/users/add" 
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-glow font-bold text-xs sm:text-sm shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          <span>Add New User</span>
        </Link>
      </div>

      <UsersTableClient users={users} selectedRole={selectedRole} />
    </div>
  );
}
