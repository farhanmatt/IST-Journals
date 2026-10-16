import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function DashboardLoading() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent rounded-xl">
      <LoadingSpinner text="Loading dashboard data..." minHeight="min-h-[500px]" />
    </div>
  );
}
