import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Trophy, Swords, User,
  Users, Megaphone, Bell, Settings, LogOut, X, Menu,
  ChevronRight, Users2, Calendar, Flame, Image,
} from "lucide-react";
import { useListNotifications } from "@workspace/api-client-react";

const BOTTOM_NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/leaderboard", icon: Trophy, label: "Ranks" },
  { href: "/scrims", icon: Swords, label: "Scrims" },
  { href: "/feed", icon: Flame, label: "Feed" },
  { href: "/profile", icon: User, label: "Profile" },
];

const SIDEBAR_NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/scrims", icon: Swords, label: "Scrims" },
  { href: "/members", icon: Users, label: "Members" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/announcements", icon: Megaphone, label: "Announcements" },
  { href: "/feed", icon: Flame, label: "Clan Feed" },
  { href: "/gallery", icon: Image, label: "Gallery" },
  { href: "/community", icon: Users2, label: "Community" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/profile", icon: User, label: "Profile" },
];

const DRAWER_SECONDARY = [
  { href: "/members", icon: Users, label: "Members" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/announcements", icon: Megaphone, label: "Announcements" },
  { href: "/gallery", icon: Image, label: "Gallery" },
  { href: "/community", icon: Users2, label: "Community" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

const ROLE_COLORS: Record<string, string> = {
  OWNER: "text-yellow-400",
  MANAGEMENT: "text-purple-400",
  TIER1: "text-red-400",
  TIER2: "text-orange-400",
  TIER3: "text-blue-400",
  NEW_MEMBER: "text-gray-400",
};

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { member, signOut } = useAuth();
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: notifications } = useListNotifications({ unreadOnly: true });
  const unreadCount = notifications?.length ?? 0;
  const canManage = member?.role === "OWNER" || member?.role === "MANAGEMENT";

  useEffect(() => { setDrawerOpen(false); }, [location]);
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const isActive = (href: string) => location === href;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#060608]">

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 lg:w-64 shrink-0 border-r border-white/8 bg-black/60 backdrop-blur-xl flex-col relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('/clan-logo.jpg')" }} />

        <div className="p-5 flex items-center gap-3 border-b border-white/6 relative shrink-0">
          <img src="/clan-logo.jpg" alt="SOLOS+" className="w-10 h-10 rounded-xl object-cover border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.3)] shrink-0" />
          <div>
            <div className="font-black tracking-[0.12em] text-base text-white leading-none">SOLOS+</div>
            <div className="text-[9px] tracking-[0.3em] text-red-400 mt-0.5">ESPORTZ</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto relative">
          {SIDEBAR_NAV.map(item => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                isActive(item.href)
                  ? "bg-red-500/15 text-red-400 border border-red-500/20"
                  : "text-white/45 hover:bg-white/5 hover:text-white/80"
              }`}>
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {isActive(item.href) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400" />}
              </div>
            </Link>
          ))}
          {canManage && (
            <Link href="/management">
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer mt-2 border ${
                isActive("/management")
                  ? "bg-red-500/15 text-red-400 border-red-500/20"
                  : "text-purple-400/70 border-purple-500/15 bg-purple-500/5 hover:bg-purple-500/10 hover:text-purple-400"
              }`}>
                <Settings className="w-4 h-4 shrink-0" />
                <span className="font-bold text-sm">Management</span>
              </div>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-white/6 relative shrink-0">
          <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl bg-white/3">
            <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 text-xs font-black shrink-0">
              {member?.displayName?.replace(/^S²十/, "").slice(0, 2).toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate text-white/90">{member?.displayName ?? "Loading..."}</div>
              <div className={`text-xs font-semibold ${ROLE_COLORS[member?.role ?? ""] ?? "text-gray-400"}`}>
                {member?.customTag ? `${member.role} · ${member.customTag}` : member?.role ?? ""}
              </div>
            </div>
          </div>
          <button onClick={signOut} className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-white/8 text-white/40 hover:text-red-400 hover:bg-red-500/8 hover:border-red-500/20 text-sm transition-all">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE DRAWER ───────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-[82vw] max-w-xs bg-[#0a0a0e] border-r border-white/10 flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/8">
              <div className="flex items-center gap-3">
                <img src="/clan-logo.jpg" alt="SOLOS+" className="w-9 h-9 rounded-xl object-cover border border-red-500/30" />
                <div>
                  <div className="font-black tracking-wider text-white">SOLOS+</div>
                  <div className="text-[9px] tracking-[0.3em] text-red-400">ESPORTZ</div>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/8">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mx-4 mt-4 p-3 rounded-xl bg-white/4 border border-white/8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 font-black shrink-0">
                {member?.displayName?.replace(/^S²十/, "").slice(0, 2).toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white truncate">{member?.displayName ?? "Loading..."}</div>
                <div className={`text-xs ${ROLE_COLORS[member?.role ?? ""] ?? "text-gray-400"}`}>
                  {member?.customTag ?? member?.role ?? ""}
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              <p className="text-[10px] text-white/25 uppercase tracking-widest px-3 mb-2">Main</p>
              {BOTTOM_NAV.map(item => (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                    isActive(item.href) ? "bg-red-500/15 text-red-400 border border-red-500/20" : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}>
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="font-semibold">{item.label}</span>
                    {isActive(item.href) && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </div>
                </Link>
              ))}

              <div className="my-3 border-t border-white/6" />
              <p className="text-[10px] text-white/25 uppercase tracking-widest px-3 mb-2">More</p>
              {DRAWER_SECONDARY.map(item => (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                    isActive(item.href) ? "bg-red-500/15 text-red-400 border border-red-500/20" : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}>
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="font-semibold">{item.label}</span>
                    {item.href === "/notifications" && unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              ))}

              {canManage && (
                <>
                  <div className="my-3 border-t border-white/6" />
                  <Link href="/management">
                    <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer border ${
                      isActive("/management")
                        ? "bg-red-500/15 text-red-400 border-red-500/20"
                        : "text-purple-400/80 border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10"
                    }`}>
                      <Settings className="w-5 h-5 shrink-0" />
                      <span className="font-bold">Management</span>
                    </div>
                  </Link>
                </>
              )}
            </nav>

            <div className="p-4 border-t border-white/8">
              <button onClick={signOut} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-white/50 hover:text-red-400 hover:bg-red-500/8 text-sm font-semibold transition-all">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/8 bg-black/60 backdrop-blur-xl z-10">
          <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-colors -ml-2">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/clan-logo.jpg" alt="SOLOS+" className="w-7 h-7 rounded-lg object-cover border border-red-500/25" />
            <span className="font-black tracking-wider text-sm text-white">SOLOS+</span>
            <span className="text-[9px] tracking-[0.2em] text-red-400">ESPORTZ</span>
          </div>
          <Link href="/notifications">
            <div className="relative p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-colors -mr-2">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          <div className="absolute inset-0 bg-cover bg-center opacity-[0.02] pointer-events-none" style={{ backgroundImage: "url('/clan-logo.jpg')" }} />
          <div className="absolute top-0 right-0 w-72 h-72 bg-red-700/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 min-h-full">
            {children}
          </div>
        </main>

        <nav className="md:hidden shrink-0 fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#070709]/95 backdrop-blur-xl">
          <div className="flex items-center justify-around px-2 py-1">
            {BOTTOM_NAV.map(item => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[52px] transition-all ${active ? "text-red-400" : "text-white/35 hover:text-white/70"}`}>
                    <div className={`relative p-1.5 rounded-xl transition-all ${active ? "bg-red-500/15" : ""}`}>
                      <item.icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                    </div>
                    <span className={`text-[10px] font-bold tracking-wide ${active ? "text-red-400" : "text-white/35"}`}>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
