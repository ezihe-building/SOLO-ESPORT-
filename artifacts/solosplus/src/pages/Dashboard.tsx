import React from "react";
import { useGetClanStats, useListAnnouncements, useListScrims, useGetTopPlayers } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Trophy, Users, Swords, Activity, Crown, Calendar, ChevronRight, Target, Pin, MessageCircle, Music2 } from "lucide-react";
import { Link } from "wouter";

const WA_LINK = "https://chat.whatsapp.com/JGkaBobItjVKhlpbQAvaX8?mode=gi_t";
const TT_LINK = "https://www.tiktok.com/@solosesportz?_r=1&_t=ZS-96nBUlDDxdl";

const ROLE_COLORS: Record<string, string> = {
  OWNER: "text-yellow-400 bg-yellow-400/10 border-yellow-400/25",
  MANAGEMENT: "text-purple-400 bg-purple-400/10 border-purple-400/25",
  TIER1: "text-red-400 bg-red-400/10 border-red-400/25",
  TIER2: "text-orange-400 bg-orange-400/10 border-orange-400/25",
  TIER3: "text-blue-400 bg-blue-400/10 border-blue-400/25",
  NEW_MEMBER: "text-gray-400 bg-gray-400/10 border-gray-400/25",
};

const TYPE_COLORS: Record<string, string> = {
  general: "bg-blue-400/15 text-blue-400",
  scrim: "bg-green-400/15 text-green-400",
  tournament: "bg-yellow-400/15 text-yellow-400",
  promotion: "bg-purple-400/15 text-purple-400",
  meeting: "bg-orange-400/15 text-orange-400",
  urgent: "bg-red-400/15 text-red-400",
};

export default function Dashboard() {
  const { member } = useAuth();
  const { data: stats } = useGetClanStats();
  const { data: announcements } = useListAnnouncements({ limit: 3 });
  const { data: scrims } = useListScrims({ status: "upcoming" });
  const { data: topPlayers } = useGetTopPlayers();

  const firstName = member?.displayName?.replace(/^S²十/, "") ?? "Soldier";

  return (
    <MainLayout>
      <div className="space-y-5 max-w-3xl mx-auto md:max-w-none">

        {/* Welcome header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-white/40 text-sm mb-0.5">Welcome back,</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              {member?.displayName ?? "Loading..."}
            </h1>
            {(member?.customTag || member?.role) && (
              <span className={`inline-flex items-center mt-2 text-xs font-bold px-2.5 py-1 rounded-full border ${ROLE_COLORS[member?.role ?? ""] ?? ""}`}>
                {member.customTag ? `${member.customTag} · ${member.role}` : member.role}
              </span>
            )}
          </div>
          <img src="/clan-logo.jpg" alt="SOLOS+" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-red-500/25 shadow-[0_0_20px_rgba(220,38,38,0.2)] shrink-0" />
        </div>

        {/* Stats grid — 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Users, label: "Active Members", value: stats?.activeMembers ?? 0, color: "text-blue-400", bg: "bg-blue-400/10" },
            { icon: Trophy, label: "Scrim Wins", value: stats?.scrimWins ?? 0, color: "text-yellow-400", bg: "bg-yellow-400/10" },
            { icon: Target, label: "Avg K/D", value: stats?.avgKd?.toFixed(2) ?? "0.00", color: "text-red-400", bg: "bg-red-400/10" },
            { icon: Swords, label: "Upcoming Scrims", value: scrims?.length ?? 0, color: "text-green-400", bg: "bg-green-400/10" },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-colors">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom grid: 1 col mobile, 2 col on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Recent Announcements */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
              <h2 className="font-bold text-sm tracking-wide text-white/80">Recent Announcements</h2>
              <Link href="/announcements">
                <span className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer">View all <ChevronRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="p-3 space-y-2">
              {!announcements?.length ? (
                <p className="text-white/30 text-sm text-center py-4">No announcements yet.</p>
              ) : announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className="p-3 rounded-xl bg-white/3 hover:bg-white/6 transition-colors">
                  <div className="flex items-start gap-2">
                    {ann.pinned && <Pin className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${TYPE_COLORS[ann.type] ?? ""}`}>
                          {ann.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-semibold text-sm text-white truncate">{ann.title}</p>
                      <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{ann.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Scrims */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
              <h2 className="font-bold text-sm tracking-wide text-white/80">Upcoming Scrims</h2>
              <Link href="/scrims">
                <span className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer">View all <ChevronRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="p-3 space-y-2">
              {!scrims?.length ? (
                <p className="text-white/30 text-sm text-center py-4">No upcoming scrims.</p>
              ) : scrims.slice(0, 3).map(scrim => (
                <div key={scrim.id} className="p-3 rounded-xl bg-white/3 hover:bg-white/6 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate">vs {scrim.opponentName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <Calendar className="w-3 h-3" />
                          {new Date(scrim.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <Users className="w-3 h-3" />
                          {scrim.signupCount ?? 0}/{scrim.requiredPlayers}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full shrink-0">
                      {scrim.gameMode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Community Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/8 border border-green-500/20 hover:bg-green-500/14 hover:border-green-500/35 transition-all group">
            <div className="w-11 h-11 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-white text-sm">Join WhatsApp Community</div>
              <div className="text-xs text-green-400/60 mt-0.5">Official SOLOS+ clan group</div>
            </div>
            <ChevronRight className="w-4 h-4 text-green-400/40 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>
          <a href={TT_LINK} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-2xl bg-pink-500/8 border border-pink-500/20 hover:bg-pink-500/14 hover:border-pink-500/35 transition-all group">
            <div className="w-11 h-11 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Music2 className="w-5 h-5 text-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-white text-sm">Visit Our TikTok</div>
              <div className="text-xs text-pink-400/60 mt-0.5">@solosesportz · Highlights & Clips</div>
            </div>
            <ChevronRight className="w-4 h-4 text-pink-400/40 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>
        </div>

        {/* Top Performers */}
        {topPlayers && (
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
              <h2 className="font-bold text-sm tracking-wide text-white/80">Top Performers</h2>
              <Link href="/leaderboard">
                <span className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer">Full rankings <ChevronRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="divide-y divide-white/4">
              {[
                { label: "Most Points", stat: topPlayers.byPoints.clanPoints.toLocaleString(), unit: "pts", icon: Crown, player: topPlayers.byPoints, color: "text-yellow-400" },
                { label: "Best K/D", stat: topPlayers.byKd.kdRatio.toFixed(2), unit: "K/D", icon: Target, player: topPlayers.byKd, color: "text-red-400" },
                { label: "Most MVPs", stat: String(topPlayers.byMvp.mvpCount), unit: "MVPs", icon: Trophy, player: topPlayers.byMvp, color: "text-purple-400" },
              ].map(({ label, stat, unit, icon: Icon, player, color }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                  <Icon className={`w-4 h-4 ${color} shrink-0`} />
                  <div className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center text-xs font-black text-red-400 shrink-0">
                    {player.displayName.replace(/^S²十/, "").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white truncate">{player.displayName}</div>
                    <div className="text-xs text-white/35">{label}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-black ${color}`}>{stat}</div>
                    <div className="text-[10px] text-white/30">{unit}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
