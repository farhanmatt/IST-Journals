import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
      <p className="text-gray-600 mb-6">
        You do not have the required permissions to view this page.
      </p>
      <Link 
        href="/"
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Return to Home
      </Link>
    </div>
  );
}
