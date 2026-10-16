"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setIsLoading(false);
    } else {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const roles = session?.user?.roles || [];
      
      if (roles.includes("ADMIN")) {
         router.push("/admin/dashboard");
      } else if (roles.includes("EDITOR")) {
         router.push("/editor/dashboard");
      } else if (roles.includes("COPYEDITOR")) {
         router.push("/copyeditor/dashboard");
      } else if (roles.includes("PRODUCTION_EDITOR")) {
         router.push("/production/dashboard");
      } else if (roles.includes("REVIEWER")) {
         router.push("/reviewer/dashboard");
      } else if (roles.includes("AUTHOR")) {
         router.push("/author/dashboard");
      } else if (roles.length > 0) {
         router.push(`/${roles[0].toLowerCase().replace('_', '-')}/dashboard`);
      } else {
         router.push("/");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-blue-50/40 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link href="/" className="inline-flex items-center space-x-3 text-blue-600 hover:text-blue-700 transition-colors mb-6 group">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="h-6 w-6" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">IST Journals</span>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in to access your dashboard and manuscripts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 sm:px-10 rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm font-medium">{error}</span>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email address</label>
              <div>
                <input 
                  type="email" 
                  required 
                  value={email}
                  placeholder="name@institution.edu"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-normal" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-normal pr-11" 
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in to Dashboard</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs sm:text-sm text-slate-500">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
