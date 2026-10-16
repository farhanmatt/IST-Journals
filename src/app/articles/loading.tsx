import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ArticlesLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-24">
      <LoadingSpinner text="Loading published articles archive..." minHeight="min-h-[300px]" />
    </div>
  );
}
