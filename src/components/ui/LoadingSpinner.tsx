import { Loader2, BookOpen } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  minHeight?: string;
  showIcon?: boolean;
}

export function LoadingSpinner({ 
  text = "Loading...", 
  minHeight = "min-h-[400px]",
  showIcon = true
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center w-full h-full ${minHeight} text-slate-500 animate-in fade-in duration-200 select-none`}>
      <div className="relative flex items-center justify-center mb-4">
        {/* Soft glowing background circle */}
        <div className="w-16 h-16 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shadow-xs">
          {showIcon && (
            <BookOpen className="w-7 h-7 text-blue-600/80 animate-pulse" />
          )}
        </div>
        {/* Spinning outer ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin [animation-duration:1.2s] opacity-70" />
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-600 tracking-wide uppercase">{text}</p>
      <div className="flex items-center gap-1 mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/60 animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/60 animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/60 animate-bounce"></span>
      </div>
    </div>
  );
}
