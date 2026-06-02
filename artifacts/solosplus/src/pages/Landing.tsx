import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trophy, Crosshair, Users, ChevronRight, Crown, MessageCircle, Music2 } from "lucide-react";

const WA_LINK = "https://chat.whatsapp.com/JGkaBobItjVKhlpbQAvaX8?mode=gi_t";
const TT_LINK = "https://www.tiktok.com/@solosesportz?_r=1&_t=ZS-96nBUlDDxdl";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#060608] flex flex-col relative overflow-hidden">

      {/* ── Background: clan logo blended ── */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.07]"
        style={{ backgroundImage: "url('/clan-logo.jpg')" }}
      />
      {/* Red ambient glow matching logo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-red-700/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[180px] pointer-events-none" />
      {/* Dark vignette edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000_90%)] pointer-events-none" />

      {/* ── Header ── */}
      <header className="px-8 py-5 flex items-center justify-between relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img
            src="/clan-logo.jpg"
            alt="SOLOS+ ESPORTZ"
            className="w-11 h-11 rounded-xl object-cover border border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.25)]"
          />
          <div>
            <span className="text-lg font-black tracking-[0.15em] text-white">SOLOS+</span>
            <div className="text-[10px] tracking-[0.3em] text-red-400 -mt-0.5">ESPORTZ</div>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/auth">
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/8 border border-white/10">Login</Button>
          </Link>
          <Link href="/auth">
            <Button className="bg-red-600 hover:bg-red-500 text-white font-bold shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all">
              Join Clan
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 pt-16 pb-28">

        {/* Clan logo — hero centerpiece */}
        <div className="relative mb-10">
          <div className="absolute inset-0 rounded-full bg-red-600/20 blur-[60px] scale-125" />
          <img
            src="/clan-logo.jpg"
            alt="SOLOS+ ESPORTZ"
            className="relative w-52 h-52 md:w-64 md:h-64 object-cover rounded-3xl border-2 border-red-500/30 shadow-[0_0_80px_rgba(220,38,38,0.35),0_0_160px_rgba(220,38,38,0.15)]"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/25 text-sm text-red-400 mb-7">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          Recruiting Tier 1 Players
        </div>

        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-5 leading-none">
          <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            ONE SQUAD.<br />ONE GOAL.<br />
          </span>
          <span className="text-red-500 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]">ONE LEGACY.</span>
        </h1>

        <p className="text-lg text-white/50 max-w-xl mb-10">
          The elite competitive Call of Duty Mobile clan. Prove your worth, climb the tiers, and dominate the leaderboards.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/auth">
            <Button size="lg" className="h-13 px-8 text-base bg-red-600 hover:bg-red-500 font-black shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] transition-all">
              Apply Now <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="/auth">
            <Button size="lg" variant="outline" className="h-13 px-8 text-base border-white/15 hover:bg-white/5 text-white/70 hover:text-white">
              Member Login
            </Button>
          </Link>
        </div>
      </main>

      {/* ── WhatsApp & TikTok ── */}
      <section className="relative z-10 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs text-white/30 uppercase tracking-[0.3em] font-bold mb-5">Join the Community</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-2xl bg-green-500/10 border border-green-500/25 hover:bg-green-500/18 hover:border-green-500/45 transition-all group shadow-[0_0_30px_rgba(34,197,94,0.06)]">
              <div className="w-14 h-14 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-7 h-7 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-black text-white text-base">Join WhatsApp Community</div>
                <div className="text-xs text-green-400/70 mt-0.5">Official SOLOS+ Clan Group</div>
              </div>
              <ChevronRight className="w-4 h-4 text-green-400/50 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href={TT_LINK} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-2xl bg-pink-500/10 border border-pink-500/25 hover:bg-pink-500/18 hover:border-pink-500/45 transition-all group shadow-[0_0_30px_rgba(236,72,153,0.06)]">
              <div className="w-14 h-14 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Music2 className="w-7 h-7 text-pink-400" />
              </div>
              <div className="flex-1">
                <div className="font-black text-white text-base">Visit Our TikTok Page</div>
                <div className="text-xs text-pink-400/70 mt-0.5">@solosesportz · Highlights & Clips</div>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-400/50 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-white/6 bg-black/50 backdrop-blur-md relative z-10 py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { Icon: Trophy, value: "150+", label: "Tournament Wins" },
            { Icon: Crosshair, value: "2.4", label: "Average K/D" },
            { Icon: Users, value: "50+", label: "Active Members" },
          ].map(({ Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center justify-center p-7 rounded-2xl bg-white/3 border border-white/6 hover:border-red-500/20 hover:bg-red-500/5 transition-colors group">
              <Icon className="w-10 h-10 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-4xl font-black text-white">{value}</span>
              <span className="text-white/40 font-medium mt-1 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="py-24 px-4 relative z-10 max-w-5xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black uppercase tracking-wider text-white mb-3">The War Room</h2>
          <p className="text-white/40">Premium tools for a premium roster.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              title: "Tiered Progression",
              desc: "Start as a recruit. Prove yourself in scrims. Climb from Tier 3 to Tier 1 through undeniable performance.",
            },
            {
              title: "Scrim Coordination",
              desc: "Automated scheduling, signup, and result tracking for all clan wars and internal scrimmages.",
            },
            {
              title: "Live Leaderboard",
              desc: "Real-time rankings by K/D, MVP count, clan points, and scrim win rate.",
            },
            {
              title: "Tier Group Chats",
              desc: "Each tier has its own private channel. Only your tier can read your strategy.",
            },
          ].map((f) => (
            <div key={f.title} className="group p-7 rounded-2xl bg-white/3 border border-white/6 hover:border-red-500/20 hover:bg-red-500/4 relative overflow-hidden transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-xl font-bold text-white mb-3 relative">{f.title}</h3>
              <p className="text-white/40 relative text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/6 bg-black/40 relative z-10 py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/clan-logo.jpg" alt="SOLOS+" className="w-7 h-7 rounded-lg object-cover opacity-60" />
          <span className="text-xs text-white/30 tracking-widest">SOLOS+ ESPORTZ — One Squad. One Goal. One Legacy.</span>
        </div>
        <Link href="/owner">
          <span className="flex items-center gap-1 text-xs text-white/20 hover:text-red-400/60 transition-colors cursor-pointer">
            <Crown className="w-3 h-3" /> Owner Access
          </span>
        </Link>
      </footer>
    </div>
  );
}
