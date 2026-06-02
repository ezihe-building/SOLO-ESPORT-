import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { XCircle, LogOut, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function Rejected() {
  const { member, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.05]" style={{ backgroundImage: "url('/clan-logo.jpg')" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.06)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000_90%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/clan-logo.jpg" alt="SOLOS+" className="w-16 h-16 rounded-xl object-cover border border-red-500/30 mx-auto mb-4" />
        </div>

        <div className="bg-white/[0.03] border border-red-500/20 rounded-2xl overflow-hidden">
          <div className="bg-red-500/10 border-b border-red-500/15 px-6 py-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Application Rejected</h1>
              <p className="text-red-400/80 text-xs font-semibold mt-0.5">Access Denied</p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-4">
            <p className="text-white/50 text-sm leading-relaxed">
              Unfortunately, your application for <span className="text-white font-bold">{member?.displayName ?? "your account"}</span> was not approved at this time.
            </p>
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/15">
              <p className="text-xs text-red-300/80 leading-relaxed">
                You may contact management via WhatsApp if you believe this was an error. Reapplication may be considered after 30 days.
              </p>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-3">
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
            <Link href="/">
              <span className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white/70 text-sm transition-colors cursor-pointer">
                <RefreshCw className="w-4 h-4" />
                Back to Home
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
