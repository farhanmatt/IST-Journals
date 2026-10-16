"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
  variant?: "icon" | "text" | "sidebar";
}

export function LogoutButton({ className = "", variant = "text" }: LogoutButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className={className || "flex items-center space-x-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"}
      >
        <LogOut className={variant === "sidebar" ? "h-5 w-5" : "h-4 w-4"} />
        {variant !== "icon" && <span>Logout</span>}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setShowModal(false)}
          />
          
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <LogOut className="w-6 h-6 text-red-600 ml-1" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Sign Out</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to log out?
              </p>
              
              <div className="flex w-full space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
