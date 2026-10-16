import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ArticleDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-24">
      <LoadingSpinner text="Loading article details..." minHeight="min-h-[300px]" />
    </div>
  );
}
