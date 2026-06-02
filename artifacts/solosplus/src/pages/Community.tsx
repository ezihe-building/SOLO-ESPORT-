import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MessageCircle, Music2, ExternalLink, Users, Star, Flame } from "lucide-react";

export default function Community() {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/15 border border-red-500/25 rounded-full px-4 py-1.5 mb-4">
            <Users className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm font-bold">Community Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">SOLOS+ Community</h1>
          <p className="text-white/45 text-sm">Connect with your clan family across platforms</p>
        </div>

        {/* WhatsApp Card */}
        <a
          href="https://chat.whatsapp.com/JGkaBobItjVKhlpbQAvaX8?mode=gi_t"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="bg-green-500/8 border border-green-500/25 rounded-2xl p-6 hover:bg-green-500/14 hover:border-green-500/40 transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-8 h-8 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-xl text-white">WhatsApp Community</span>
                  <ExternalLink className="w-4 h-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-white/55 text-sm mb-3">
                  Join the official SOLOS+ ESPORTZ WhatsApp community for scrim announcements, clan news, team coordination and direct communication with management.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["Scrim Alerts", "Match Results", "Clan Updates", "Team Chat"].map(tag => (
                    <span key={tag} className="text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold text-sm py-3 px-5 rounded-xl transition-colors justify-center">
                  <MessageCircle className="w-4 h-4" />
                  Join WhatsApp Community
                </div>
              </div>
            </div>
          </div>
        </a>

        {/* TikTok Card */}
        <a
          href="https://www.tiktok.com/@solosesportz?_r=1&_t=ZS-96nBUlDDxdl"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="bg-pink-500/8 border border-pink-500/25 rounded-2xl p-6 hover:bg-pink-500/14 hover:border-pink-500/40 transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Music2 className="w-8 h-8 text-pink-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-xl text-white">TikTok Page</span>
                  <ExternalLink className="w-4 h-4 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-white/55 text-sm mb-1 font-bold text-pink-300">@solosesportz</p>
                <p className="text-white/55 text-sm mb-3">
                  Follow our official TikTok page for match highlights, scrim montages, tournament moments, and behind-the-scenes clan content.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["Match Clips", "Highlights", "Scrims", "Tournaments"].map(tag => (
                    <span key={tag} className="text-[10px] font-bold text-pink-400 bg-pink-400/10 border border-pink-400/20 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold text-sm py-3 px-5 rounded-xl transition-all justify-center">
                  <Music2 className="w-4 h-4" />
                  Visit TikTok Page
                </div>
              </div>
            </div>
          </div>
        </a>

        {/* Clan Info */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
          <h3 className="font-black text-white mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            About SOLOS+ ESPORTZ
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Users, label: "Clan Tag", value: "S²十", color: "text-red-400" },
              { icon: Star, label: "Game", value: "CODM BR", color: "text-yellow-400" },
              { icon: Flame, label: "Focus", value: "Battle Royale", color: "text-orange-400" },
              { icon: Music2, label: "Content", value: "TikTok Active", color: "text-pink-400" },
            ].map(item => (
              <div key={item.label} className="bg-white/3 rounded-xl p-3 flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                <div>
                  <p className="text-xs text-white/35 uppercase tracking-wide">{item.label}</p>
                  <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
