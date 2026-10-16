import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AdminRootLoading() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
      <LoadingSpinner text="Authenticating..." minHeight="min-h-[400px]" />
    </div>
  );
}
