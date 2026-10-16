import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  minHeight?: string;
}

export function LoadingSpinner({ 
  text = "Loading...", 
  minHeight = "min-h-[400px]" 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center w-full h-full ${minHeight} text-slate-500`}>
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
      <p className="text-sm font-medium animate-pulse">{text}</p>
    </div>
  );
}
