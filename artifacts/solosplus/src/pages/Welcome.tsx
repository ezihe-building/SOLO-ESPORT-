import React from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useListAnnouncements, useListScrims } from "@workspace/api-client-react";
import { MessageCircle, Music2, ChevronRight, Trophy, Swords, Shield, CheckCircle, Bell, Users, BookOpen } from "lucide-react";

const CLAN_RULES = [
  "Respect all clan members at all times.",
  "Always represent SOLOS+ ESPORTZ with good sportsmanship.",
  "Stay active — attend scheduled scrims and events.",
  "No toxic behavior, harassment, or cheating of any kind.",
  "Communicate in the clan WhatsApp group for updates.",
  "Follow management instructions during scrims and tournaments.",
  "Keep your CODM tag updated to include the S²十 prefix.",
  "Report issues to management privately, not publicly.",
];

export default function Welcome() {
  const { member } = useAuth();
  const { data: announcements } = useListAnnouncements({ limit: 3 });
  const { data: scrims } = useListScrims({ status: "upcoming" });

  return (
    <div className="min-h-screen bg-[#060608] text-white overflow-y-auto">
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.04] pointer-events-none" style={{ backgroundImage: "url('/clan-logo.jpg')" }} />
      <div className="fixed top-0 left-0 right-0 w-full h-64 bg-red-600/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 pb-16">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 rounded-2xl bg-red-600/25 blur-xl scale-110" />
            <img src="/clan-logo.jpg" alt="SOLOS+" className="relative w-24 h-24 rounded-2xl object-cover border-2 border-red-500/50 shadow-[0_0_40px_rgba(220,38,38,0.3)] mx-auto" />
          </div>
          <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 rounded-full px-4 py-1.5 mb-4">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-bold">Application Approved</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
            Welcome to<br />
            <span className="text-red-400">SOLOS+ ESPORTZ</span>
          </h1>
          <p className="text-white/50 text-sm">
            {member?.displayName ? `${member.displayName}, you're now an official member.` : "You're now an official member."}
          </p>
        </div>

        {/* Community Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <a
            href="https://chat.whatsapp.com/JGkaBobItjVKhlpbQAvaX8?mode=gi_t"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/25 hover:bg-green-500/18 hover:border-green-500/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="font-black text-white">Join WhatsApp Community</div>
              <div className="text-xs text-white/45">Official SOLOS+ group</div>
            </div>
            <ChevronRight className="w-4 h-4 text-green-400/60 group-hover:translate-x-1 transition-transform" />
          </a>

          <a
            href="https://www.tiktok.com/@solosesportz?_r=1&_t=ZS-96nBUlDDxdl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-2xl bg-pink-500/10 border border-pink-500/25 hover:bg-pink-500/18 hover:border-pink-500/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Music2 className="w-6 h-6 text-pink-400" />
            </div>
            <div className="flex-1">
              <div className="font-black text-white">Follow Our TikTok</div>
              <div className="text-xs text-white/45">@solosesportz</div>
            </div>
            <ChevronRight className="w-4 h-4 text-pink-400/60 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Clan Rules */}
        <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden mb-5">
          <div className="flex items-center gap-3 p-4 border-b border-white/6">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="font-black text-white">Clan Rules</h2>
          </div>
          <div className="p-4 space-y-2.5">
            {CLAN_RULES.map((rule, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-black text-red-400">{i + 1}</span>
                </div>
                <p className="text-sm text-white/75 leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Announcements */}
        {announcements && announcements.length > 0 && (
          <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden mb-5">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-yellow-400" />
                <h3 className="font-bold text-sm text-white">Latest Announcements</h3>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className="p-4">
                  <p className="font-bold text-sm text-white">{ann.title}</p>
                  <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Scrims */}
        {scrims && scrims.length > 0 && (
          <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden mb-5">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6">
              <Swords className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm text-white">Upcoming Scrims</h3>
            </div>
            <div className="divide-y divide-white/5">
              {scrims.slice(0, 2).map(scrim => (
                <div key={scrim.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-white">vs {scrim.opponentName}</p>
                    <p className="text-xs text-white/45">{new Date(scrim.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
                  </div>
                  <span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">{scrim.gameMode}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="space-y-3">
          <Link href="/dashboard">
            <button className="w-full bg-red-600 hover:bg-red-500 text-white font-black tracking-wider py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" />
              Enter the Dashboard
            </button>
          </Link>
          <Link href="/profile">
            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Users className="w-4 h-4 text-white/60" />
              Complete Your Profile
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
