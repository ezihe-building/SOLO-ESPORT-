import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Phone, Mail, User, LogOut, Crown } from "lucide-react";

export default function Pending() {
  const { member, user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.05]" style={{ backgroundImage: "url('/clan-logo.jpg')" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(234,179,8,0.06)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000_90%)]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/clan-logo.jpg" alt="SOLOS+" className="w-16 h-16 rounded-xl object-cover border border-yellow-500/30 mx-auto mb-4 shadow-[0_0_30px_rgba(234,179,8,0.2)]" />
        </div>

        {/* Status card */}
        <div className="bg-white/[0.03] border border-yellow-500/20 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-yellow-500/10 border-b border-yellow-500/15 px-6 py-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Application Pending</h1>
              <p className="text-yellow-400/80 text-xs font-semibold mt-0.5">Under Management Review</p>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-5">
            <p className="text-white/50 text-sm leading-relaxed">
              Your application to join <span className="text-white font-bold">SOLOS+ ESPORTZ</span> is being reviewed. Management will approve or reject your request shortly.
            </p>

            {/* Application info */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Your Application</p>

              <div className="flex items-center gap-3">
                <Crown className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-white/35">Clan Tag Username</p>
                  <p className="text-sm font-bold text-white">{member?.displayName ?? "Loading..."}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-white/30 shrink-0" />
                <div>
                  <p className="text-[11px] text-white/35">CODM Username</p>
                  <p className="text-sm font-semibold text-white/70">{member?.codmUsername ?? "—"}</p>
                </div>
              </div>

              {member?.whatsappNumber && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-green-400 shrink-0" />
                  <div>
                    <p className="text-[11px] text-white/35">WhatsApp Number</p>
                    <p className="text-sm font-semibold text-white/70">{member.whatsappNumber}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-white/30 shrink-0" />
                <div>
                  <p className="text-[11px] text-white/35">Email</p>
                  <p className="text-sm font-semibold text-white/70">{member?.email ?? user?.email ?? "—"}</p>
                </div>
              </div>

              {member?.createdAt && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-white/30 shrink-0" />
                  <div>
                    <p className="text-[11px] text-white/35">Date Applied</p>
                    <p className="text-sm font-semibold text-white/70">
                      {new Date(member.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-yellow-500/8 border border-yellow-500/15">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
              <p className="text-xs text-yellow-300/80">
                You will gain access immediately after approval. Check back later or watch for a notification.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-sm font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
