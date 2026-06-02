import React, { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  User, Edit2, Trophy, Target, Star, Swords, Activity,
  Phone, Music2, Instagram, MessageCircle, Skull, TrendingUp, Award, X, Check, Upload, Camera, Trash2,
} from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
  MANAGEMENT: "bg-purple-400/10 text-purple-400 border-purple-400/30",
  TIER1: "bg-red-400/10 text-red-400 border-red-400/30",
  TIER2: "bg-orange-400/10 text-orange-400 border-orange-400/30",
  TIER3: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  NEW_MEMBER: "bg-gray-400/10 text-gray-400 border-gray-400/30",
};

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export default function Profile() {
  const { member } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    displayName: member?.displayName ?? "",
    bio: member?.bio ?? "",
    avatarUrl: (member as any)?.avatarUrl ?? "",
    whatsappNumber: (member as any)?.whatsappNumber ?? "",
    tiktokUsername: (member as any)?.tiktokUsername ?? "",
    instagramUsername: (member as any)?.instagramUsername ?? "",
    discordUsername: (member as any)?.discordUsername ?? "",
  });

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = (reader.result as string).split(",")[1];
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const token = await getToken();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ base64, filename: file.name, bucket: "profiles" }),
      });
      if (res.ok) {
        const { url } = await res.json();
        setForm(prev => ({ ...prev, avatarUrl: url }));
        toast({ title: "Photo uploaded!" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Upload failed", description: (err as any).error ?? "Try a URL instead.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload failed", description: "Please paste an image URL instead.", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/members/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          displayName: form.displayName || undefined,
          bio: form.bio || undefined,
          avatarUrl: form.avatarUrl || null,
          whatsappNumber: form.whatsappNumber || undefined,
          tiktokUsername: form.tiktokUsername || undefined,
          instagramUsername: form.instagramUsername || undefined,
          discordUsername: form.discordUsername || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      queryClient.invalidateQueries({ queryKey: ["getMe"] });
      toast({ title: "Profile updated!" });
      setEditing(false);
    } catch {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally { setSaving(false); }
  }

  if (!member) return null;

  const m = member as any;
  const initials = member.displayName.replace(/^S²十/, "").slice(0, 2).toUpperCase();
  const displayAvatar = editing ? form.avatarUrl : (m.avatarUrl ?? "");

  const stats = [
    { label: "Kills", value: (m.kills ?? 0).toLocaleString(), icon: Skull, color: "text-red-400" },
    { label: "Deaths", value: (m.deaths ?? 0).toLocaleString(), icon: Skull, color: "text-gray-400" },
    { label: "K/D Ratio", value: (m.kdRatio ?? 0).toFixed(2), icon: Target, color: "text-orange-400" },
    { label: "Wins", value: (m.totalWins ?? 0).toLocaleString(), icon: Trophy, color: "text-green-400" },
    { label: "Losses", value: (m.totalLosses ?? 0).toLocaleString(), icon: TrendingUp, color: "text-red-400" },
    { label: "MVP Count", value: m.mvpCount ?? 0, icon: Star, color: "text-yellow-400" },
    { label: "Clan Points", value: (m.clanPoints ?? 0).toLocaleString(), icon: Trophy, color: "text-yellow-400" },
    { label: "Activity", value: m.activityScore ?? 0, icon: Activity, color: "text-blue-400" },
    { label: "Tournament Wins", value: m.tournamentWins ?? 0, icon: Trophy, color: "text-purple-400" },
    { label: "Scrim Wins", value: m.scrimWins ?? 0, icon: Swords, color: "text-cyan-400" },
  ];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">My Profile</h1>
          <p className="text-white/40 text-sm mt-0.5">Your identity in SOLOS+ ESPORTZ</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Avatar with upload overlay */}
              <div className="relative shrink-0 group">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={member.displayName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center text-red-400 font-black text-2xl sm:text-3xl">
                    {initials}
                  </div>
                )}
                {editing && (
                  <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}>
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-white">{member.displayName}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[member.role] ?? ""}`}>{member.role}</span>
                  {(member as any).customTag && <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{(member as any).customTag}</span>}
                </div>
                {member.bio && !editing && <p className="text-sm text-white/55 mt-2 leading-relaxed">{member.bio}</p>}
                <p className="text-xs text-white/25 mt-2">Joined {new Date(member.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <button onClick={() => {
                setForm({ displayName: member.displayName ?? "", bio: member.bio ?? "", avatarUrl: m.avatarUrl ?? "", whatsappNumber: m.whatsappNumber ?? "", tiktokUsername: m.tiktokUsername ?? "", instagramUsername: m.instagramUsername ?? "", discordUsername: m.discordUsername ?? "" });
                setEditing(!editing);
              }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs font-bold transition-colors shrink-0">
                {editing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                {editing ? "Cancel" : "Edit"}
              </button>
            </div>

            {/* Social Links (view mode) */}
            {!editing && (
              <div className="flex flex-wrap gap-2 mt-4">
                {m.whatsappNumber && (
                  <a href={`https://wa.me/${m.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/8 border border-green-400/20 px-2.5 py-1.5 rounded-xl hover:bg-green-400/14 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" />{m.whatsappNumber}
                  </a>
                )}
                {m.tiktokUsername && (
                  <a href={`https://tiktok.com/@${m.tiktokUsername}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-pink-400 bg-pink-400/8 border border-pink-400/20 px-2.5 py-1.5 rounded-xl hover:bg-pink-400/14 transition-colors">
                    <Music2 className="w-3.5 h-3.5" />@{m.tiktokUsername}
                  </a>
                )}
                {m.instagramUsername && (
                  <a href={`https://instagram.com/${m.instagramUsername}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-400/8 border border-purple-400/20 px-2.5 py-1.5 rounded-xl hover:bg-purple-400/14 transition-colors">
                    <Instagram className="w-3.5 h-3.5" />@{m.instagramUsername}
                  </a>
                )}
                {m.discordUsername && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-400/8 border border-blue-400/20 px-2.5 py-1.5 rounded-xl">
                    <User className="w-3.5 h-3.5" />{m.discordUsername}
                  </div>
                )}
              </div>
            )}

            {/* Edit Form */}
            {editing && (
              <form onSubmit={handleSave} className="mt-5 pt-5 border-t border-white/8 space-y-4">
                {/* Hidden file input for avatar */}
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />

                {/* Avatar section */}
                <div>
                  <label className="text-xs text-white/40 block mb-2">Profile Picture</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-bold transition-colors disabled:opacity-50">
                      {uploadingAvatar ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                    </button>
                    <span className="text-white/25 text-xs">or paste URL:</span>
                    <div className="flex-1 min-w-0">
                      <input type="text" value={form.avatarUrl} onChange={e => setForm(prev => ({ ...prev, avatarUrl: e.target.value }))} placeholder="https://..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/40" />
                    </div>
                    {form.avatarUrl && (
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, avatarUrl: "" }))}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-colors">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                  {form.avatarUrl && (
                    <img src={form.avatarUrl} alt="preview" className="mt-2 w-16 h-16 rounded-2xl object-cover border-2 border-red-500/30"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                </div>

                {/* Display name */}
                <div>
                  <label className="text-xs text-white/40 block mb-1.5">Display Name</label>
                  <input type="text" value={form.displayName} onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))} placeholder="Your display name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/40" />
                </div>

                {/* Social fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "whatsappNumber", label: "WhatsApp Number", placeholder: "+44 7700 000000", icon: Phone },
                    { key: "tiktokUsername", label: "TikTok Username", placeholder: "username (no @)", icon: Music2 },
                    { key: "instagramUsername", label: "Instagram", placeholder: "username (no @)", icon: Instagram },
                    { key: "discordUsername", label: "Discord Username", placeholder: "user#1234 or user", icon: User },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-white/40 block mb-1.5">{f.label}</label>
                      <input type="text" value={form[f.key as keyof typeof form]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/40" />
                    </div>
                  ))}
                </div>

                {/* Bio */}
                <div>
                  <label className="text-xs text-white/40 block mb-1.5">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))} placeholder="Tell the clan about yourself..."
                    rows={3} maxLength={200}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:border-red-500/40" />
                  <p className="text-xs text-white/25 mt-1">{form.bio.length}/200</p>
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                    {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 font-bold text-sm rounded-xl transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Combat Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map(stat => (
              <div key={stat.label} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 flex items-center gap-3 hover:border-white/15 transition-colors">
                <stat.icon className={`w-5 h-5 shrink-0 ${stat.color}`} />
                <div>
                  <div className={`text-lg font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-white/35">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        {(m.achievements ?? []).length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Award className="w-3.5 h-3.5" />Badges & Achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              {(m.achievements ?? []).map((badge: string, i: number) => (
                <span key={i} className="text-xs font-bold bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-3 py-1.5 rounded-xl">{badge}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
