import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ProductionLoading() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent rounded-xl py-12">
      <LoadingSpinner text="Loading production panel..." minHeight="min-h-[400px]" />
    </div>
  );
}
