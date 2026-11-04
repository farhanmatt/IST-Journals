import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-blue-50/40 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-100">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="h-8 w-8 text-amber-600" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
            Access Restricted
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Unauthorized Access
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
            Your current account credentials do not have the required permissions or roles to view this portal area.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 gap-2"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Return to Home</span>
          </Link>
          <Link 
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-xs shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Switch Account</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          Need access? Contact your Journal Manager or System Administrator.
        </div>
      </div>
    </div>
  );
}
