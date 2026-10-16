import prisma from "@/lib/prisma";
import { RolesMatrix } from "./RolesMatrix";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";

export default async function RolesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.roles?.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  // Fetch existing permissions
  const rolePermissions = await prisma.rolePermission.findMany();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Roles & Permissions</h1>
        <p className="text-slate-500 mt-1">Configure system access and capabilities for each role.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-medium text-slate-800">Permission Matrix</h2>
        </div>
        
        <RolesMatrix initialData={rolePermissions} />
      </div>
    </div>
  );
}
