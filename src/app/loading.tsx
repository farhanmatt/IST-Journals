import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function RootLoading() {
  return (
    <div className="flex-1 w-full flex items-center justify-center bg-slate-50/50 min-h-screen">
      <LoadingSpinner text="Loading content..." />
    </div>
  );
}
