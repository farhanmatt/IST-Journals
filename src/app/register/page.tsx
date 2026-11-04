"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, User, Mail, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { registerUser } from "./actions";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);

    const result = await registerUser(formData);
    
    if (!result.success) {
      setError(result.error || "Registration failed. Please try again.");
      setIsLoading(false);
    } else {
      router.push("/login?registered=true");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-100 overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 -right-20 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-20 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-mesh-hero pointer-events-none opacity-60" />

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link href="/" className="inline-flex items-center space-x-3 text-blue-600 hover:text-blue-700 transition-colors mb-6 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-white group-hover:scale-105 transition-all">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-black text-slate-900 tracking-tight block">IST Journals</span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block -mt-1">
              Author Registration
            </span>
          </div>
        </Link>
        <h1 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Create an account
        </h1>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-500">
          Join our scholarly community to submit manuscripts and participate in peer review
        </p>
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-9 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-card-hover">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-sm flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm font-medium">{error}</span>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  required 
                  value={name}
                  placeholder="Prof. / Dr. Jane Doe"
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-normal" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email}
                  placeholder="jane.doe@university.edu"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-normal" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  placeholder="Create a secure password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-normal" 
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
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 shadow-md shadow-blue-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Create Author Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Trust Strip */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>COPE Ethics Aligned</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free Open Access</span>
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs sm:text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
