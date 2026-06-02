import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  useListPendingMembers, useListMembers, useApproveMember, useRejectMember,
  usePromoteMember, useDemoteMember, useGetClanStats, useListAnnouncements,
  useCreateAnnouncement, useDeleteAnnouncement, useListScrims, useCreateScrim,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Settings2, UserCheck, UserX, Users, Trophy, Swords, Activity,
  Phone, Mail, Calendar, Crown, AlertCircle, Megaphone, Plus, Trash2,
  Pin, Send, BarChart2, Tag, Shield, Check, X, Clock, Image, Flame,
  Star, TrendingUp, Search, Ban, RefreshCw, Skull, Heart, Camera,
  Eye, Edit2, Award, Target, ChevronDown, ChevronUp, Hash, Video, Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const ROLES = ["OWNER", "MANAGEMENT", "TIER1", "TIER2", "TIER3", "NEW_MEMBER"] as const;
type Role = typeof ROLES[number];

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
  MANAGEMENT: "bg-purple-400/10 text-purple-400 border-purple-400/30",
  TIER1: "bg-red-400/10 text-red-400 border-red-400/30",
  TIER2: "bg-orange-400/10 text-orange-400 border-orange-400/30",
  TIER3: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  NEW_MEMBER: "bg-gray-400/10 text-gray-400 border-gray-400/30",
};

const ANN_TYPES = ["general", "scrim", "tournament", "promotion", "meeting", "urgent"] as const;
const ANN_COLORS: Record<string, string> = {
  general: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  scrim: "bg-green-400/10 text-green-400 border-green-400/30",
  tournament: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
  promotion: "bg-purple-400/10 text-purple-400 border-purple-400/30",
  meeting: "bg-orange-400/10 text-orange-400 border-orange-400/30",
  urgent: "bg-red-400/10 text-red-400 border-red-400/30",
};

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart2 },
  { id: "applications", label: "Applications", icon: UserCheck },
  { id: "members", label: "Members", icon: Users },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "events", label: "Events", icon: Calendar },
  { id: "scrims", label: "Scrims", icon: Swords },
  { id: "leaderboard", label: "Stats Editor", icon: TrendingUp },
  { id: "gallery", label: "Gallery & Feed", icon: Image },
  { id: "settings", label: "Broadcast", icon: Send },
] as const;
type TabId = typeof TABS[number]["id"];

interface MemberExt {
  id: string; displayName: string; codmUsername: string; email: string;
  role: string; status: string; customTag?: string | null; whatsappNumber?: string | null;
  tiktokUsername?: string | null; instagramUsername?: string | null; discordUsername?: string | null;
  clanPoints: number; kills: number; deaths: number; kdRatio: number;
  totalWins: number; totalLosses: number; mvpCount: number;
  activityScore: number; tournamentWins: number; scrimWins: number;
  achievements: string[]; avatarUrl?: string | null; bio?: string | null;
  createdAt: string;
}
interface EventItem { id: string; title: string; description: string; imageUrl: string | null; eventDate: string; createdByName: string; }
interface FeedPost { id: string; authorName: string; authorRole: string; content: string; imageUrl: string | null; postType: string; likeCount: number; createdAt: string; }
interface MediaItem { id: string; title: string; imageUrl: string; category: string; uploadedByName: string; createdAt: string; }

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}
async function authFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any).error ?? "Request failed");
  return body;
}

function Spinner() { return <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />; }
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <div className="mb-5"><h2 className="text-lg sm:text-xl font-black text-white">{title}</h2>{subtitle && <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>}</div>;
}
function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color.replace("text-","bg-").replace(/400$/,"400/10")}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div><div className={`text-xl font-black ${color}`}>{value}</div><div className="text-xs text-white/40">{label}</div></div>
    </div>
  );
}
function TextInput({ value, onChange, placeholder, type = "text", className = "" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 ${className}`} />;
}

const PRESET_BADGES = [
  "🏆 Tournament Champion", "⚔️ Scrim Legend", "💀 Top Fragger", "🎯 Sharpshooter",
  "🛡️ Defender", "👑 Clan Legend", "🔥 On Fire", "⭐ MVP Master",
  "🏅 Veteran", "🎮 OG Member", "💪 Grinder", "🌟 Elite Performer",
];

const FEED_POST_TYPES = [
  { value: "news", label: "News" }, { value: "tournament", label: "Tournament" },
  { value: "achievement", label: "Achievement" }, { value: "screenshot", label: "Screenshot" },
  { value: "promotion", label: "Promotion" }, { value: "highlight", label: "Highlight" },
  { value: "scrim_result", label: "Scrim Result" },
];
const MEDIA_CATEGORIES = [
  { value: "scrim", label: "Scrim" }, { value: "tournament", label: "Tournament" },
  { value: "event", label: "Event" }, { value: "achievement", label: "Achievement" },
  { value: "clan_life", label: "Clan Life" },
];

export default function Management() {
  const { member } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("dashboard");

  // Member states
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [memberSearch, setMemberSearch] = useState("");
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [roleDialogId, setRoleDialogId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("TIER3");
  const [tagInput, setTagInput] = useState("");
  const [statsDialogId, setStatsDialogId] = useState<string | null>(null);
  const [statsForm, setStatsForm] = useState({ kills:"0",deaths:"0",kdRatio:"0.00",totalWins:"0",totalLosses:"0",mvpCount:"0",clanPoints:"0",activityScore:"0",tournamentWins:"0",scrimWins:"0" });
  const [badgesDialogId, setBadgesDialogId] = useState<string | null>(null);
  const [badgesInput, setBadgesInput] = useState<string[]>([]);
  const [allMembers, setAllMembers] = useState<MemberExt[]>([]);
  const [allMembersLoading, setAllMembersLoading] = useState(false);

  // Announcement states
  const [annForm, setAnnForm] = useState({ title: "", content: "", type: "general", pinned: false });
  const [editAnnId, setEditAnnId] = useState<string | null>(null);
  const [editAnnForm, setEditAnnForm] = useState({ title: "", content: "", type: "general", pinned: false });

  // Events states
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", description: "", imageUrl: "", eventDate: "" });
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [editEventForm, setEditEventForm] = useState({ title: "", description: "", imageUrl: "", eventDate: "" });

  // Gallery & Feed states
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [galleryTab, setGalleryTab] = useState<"gallery" | "feed">("gallery");
  const [feedForm, setFeedForm] = useState({ content: "", imageUrl: "", postType: "news" });
  const [mediaForm, setMediaForm] = useState({ title: "", imageUrl: "", category: "clan_life" });

  // Broadcast states
  const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "", targetRole: "ALL" });
  const [broadcastSending, setBroadcastSending] = useState(false);

  // Scrim states
  const [scrimForm, setScrimForm] = useState({ opponentName: "", scheduledAt: "", gameMode: "Battle Royale", requiredPlayers: "5", notes: "" });
  const [scrimResultId, setScrimResultId] = useState<string | null>(null);
  const [scrimResult, setScrimResult] = useState<"win" | "loss" | "draw">("win");

  // Data fetching
  const { data: pending, isLoading: pendingLoading, error: pendingError } = useListPendingMembers();
  const { data: activeMembers, isLoading: membersLoading } = useListMembers({ status: "active" });
  const { data: stats } = useGetClanStats();
  const { data: announcements, isLoading: annLoading } = useListAnnouncements({ limit: 100 });
  const { data: scrims, isLoading: scrimsLoading } = useListScrims();

  const approve = useApproveMember();
  const reject = useRejectMember();
  const promote = usePromoteMember();
  const demote = useDemoteMember();
  const createAnn = useCreateAnnouncement();
  const deleteAnn = useDeleteAnnouncement();
  const createScrim = useCreateScrim();

  const invalidate = (keys: string[]) => keys.forEach(k => qc.invalidateQueries({ queryKey: [k] }));
  const addProc = (id: string) => setProcessingIds(p => new Set(p).add(id));
  const remProc = (id: string) => setProcessingIds(p => { const s = new Set(p); s.delete(id); return s; });

  // Load all members (includes suspended, kicked)
  const loadAllMembers = useCallback(async () => {
    setAllMembersLoading(true);
    try {
      const data = await authFetch("/members");
      setAllMembers(data ?? []);
    } catch { /* ignore */ }
    setAllMembersLoading(false);
  }, []);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try { const data = await authFetch("/events"); setEvents(data ?? []); } catch { /**/ }
    setEventsLoading(false);
  }, []);

  const loadFeed = useCallback(async () => {
    try { const data = await authFetch("/feed"); setFeed(data ?? []); } catch { /**/ }
  }, []);

  const loadMedia = useCallback(async () => {
    try { const data = await authFetch("/media"); setMedia(data ?? []); } catch { /**/ }
  }, []);

  useEffect(() => {
    if (tab === "members" || tab === "leaderboard") loadAllMembers();
    if (tab === "events") loadEvents();
    if (tab === "gallery") { loadFeed(); loadMedia(); }
  }, [tab]);

  // ── Member actions ──
  async function handleApprove(id: string, name: string) {
    if (processingIds.has(`approve-${id}`)) return;
    addProc(`approve-${id}`);
    try {
      await approve.mutateAsync({ id });
      invalidate(["listPendingMembers","listMembers","getClanStats"]);
      toast({ title: `✓ ${name} approved!` });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { remProc(`approve-${id}`); }
  }
  async function handleReject(id: string, name: string) {
    if (processingIds.has(`reject-${id}`)) return;
    addProc(`reject-${id}`);
    try {
      await reject.mutateAsync({ id });
      invalidate(["listPendingMembers","getClanStats"]);
      toast({ title: `${name} rejected.` });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { remProc(`reject-${id}`); }
  }

  function openRoleDialog(m: MemberExt) {
    setRoleDialogId(m.id);
    setSelectedRole(m.role as Role);
    setTagInput(m.customTag ?? "");
  }
  async function handleRoleChange() {
    if (!roleDialogId) return;
    const target = allMembers.find(m => m.id === roleDialogId) ?? activeMembers?.find(m => m.id === roleDialogId);
    if (!target) return;
    const currentIdx = ROLES.indexOf(target.role as Role);
    const newIdx = ROLES.indexOf(selectedRole);
    try {
      if (newIdx <= currentIdx) {
        await promote.mutateAsync({ id: roleDialogId, data: { role: selectedRole } });
      } else {
        await demote.mutateAsync({ id: roleDialogId, data: { role: selectedRole } });
      }
      await authFetch(`/members/${roleDialogId}/tag`, { method: "POST", body: JSON.stringify({ customTag: tagInput.trim() || null }) });
      invalidate(["listMembers"]); loadAllMembers();
      toast({ title: `Role → ${selectedRole}${tagInput ? ` · ${tagInput}` : ""}` });
      setRoleDialogId(null);
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  function openStatsDialog(m: MemberExt) {
    setStatsDialogId(m.id);
    setStatsForm({
      kills: String(m.kills ?? 0), deaths: String(m.deaths ?? 0),
      kdRatio: (m.kdRatio ?? 0).toFixed(2), totalWins: String(m.totalWins ?? 0),
      totalLosses: String(m.totalLosses ?? 0), mvpCount: String(m.mvpCount ?? 0),
      clanPoints: String(m.clanPoints ?? 0), activityScore: String(m.activityScore ?? 0),
      tournamentWins: String(m.tournamentWins ?? 0), scrimWins: String(m.scrimWins ?? 0),
    });
  }
  async function handleUpdateStats(e: React.FormEvent) {
    e.preventDefault();
    if (!statsDialogId) return;
    try {
      await authFetch(`/members/${statsDialogId}/stats`, {
        method: "POST",
        body: JSON.stringify({
          kills: Number(statsForm.kills), deaths: Number(statsForm.deaths),
          kdRatio: parseFloat(statsForm.kdRatio), totalWins: Number(statsForm.totalWins),
          totalLosses: Number(statsForm.totalLosses), mvpCount: Number(statsForm.mvpCount),
          clanPoints: Number(statsForm.clanPoints), activityScore: Number(statsForm.activityScore),
          tournamentWins: Number(statsForm.tournamentWins), scrimWins: Number(statsForm.scrimWins),
        }),
      });
      invalidate(["listMembers","getLeaderboard","getTopPlayers"]); loadAllMembers();
      toast({ title: "Stats updated!" });
      setStatsDialogId(null);
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  function openBadgesDialog(m: MemberExt) {
    setBadgesDialogId(m.id);
    setBadgesInput([...(m.achievements ?? [])]);
  }
  async function handleSaveBadges() {
    if (!badgesDialogId) return;
    try {
      await authFetch(`/members/${badgesDialogId}/badges`, { method: "POST", body: JSON.stringify({ achievements: badgesInput }) });
      loadAllMembers();
      toast({ title: "Badges saved!" });
      setBadgesDialogId(null);
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  async function handleSuspend(id: string, name: string) {
    const reason = prompt(`Reason for suspending ${name} (optional):`);
    if (reason === null) return;
    try {
      await authFetch(`/members/${id}/suspend`, { method: "POST", body: JSON.stringify({ reason }) });
      loadAllMembers(); invalidate(["listMembers","getClanStats"]);
      toast({ title: `${name} suspended.` });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }
  async function handleRestore(id: string, name: string) {
    try {
      await authFetch(`/members/${id}/restore`, { method: "POST" });
      loadAllMembers(); invalidate(["listMembers","getClanStats"]);
      toast({ title: `${name} restored!` });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }
  async function handleKick(id: string, name: string) {
    if (!confirm(`Kick ${name} from the clan?`)) return;
    try {
      await authFetch(`/members/${id}`, { method: "DELETE" });
      loadAllMembers(); invalidate(["listMembers","getClanStats"]);
      toast({ title: `${name} kicked.` });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  // ── Announcement actions ──
  async function handleCreateAnn(e: React.FormEvent) {
    e.preventDefault();
    if (!annForm.title.trim() || !annForm.content.trim()) return;
    try {
      await createAnn.mutateAsync({ data: { ...annForm, authorId: member!.id, authorName: member!.displayName, type: annForm.type as any } });
      invalidate(["listAnnouncements"]);
      toast({ title: "Announcement posted!" });
      setAnnForm({ title: "", content: "", type: "general", pinned: false });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }
  async function handleDeleteAnn(id: string) {
    if (!confirm("Delete this announcement?")) return;
    try {
      await deleteAnn.mutateAsync({ id });
      invalidate(["listAnnouncements"]);
      toast({ title: "Deleted." });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  }
  async function handlePinAnn(id: string, currentPinned: boolean) {
    try {
      await authFetch(`/announcements/${id}`, { method: "PATCH", body: JSON.stringify({ pinned: !currentPinned }) });
      invalidate(["listAnnouncements"]);
      toast({ title: currentPinned ? "Unpinned." : "Pinned!" });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  // ── Scrim actions ──
  async function handleCreateScrim(e: React.FormEvent) {
    e.preventDefault();
    if (!scrimForm.opponentName || !scrimForm.scheduledAt) return;
    try {
      await createScrim.mutateAsync({
        data: {
          opponentName: scrimForm.opponentName,
          scheduledAt: new Date(scrimForm.scheduledAt).toISOString(),
          gameMode: scrimForm.gameMode,
          requiredPlayers: Number(scrimForm.requiredPlayers),
          notes: scrimForm.notes || undefined,
        },
      });
      invalidate(["listScrims"]);
      toast({ title: "Scrim scheduled!" });
      setScrimForm({ opponentName: "", scheduledAt: "", gameMode: "Battle Royale", requiredPlayers: "5", notes: "" });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }
  async function handleDeleteScrim(id: string, name: string) {
    if (!confirm(`Delete scrim vs ${name}?`)) return;
    try {
      await authFetch(`/scrims/${id}`, { method: "DELETE" });
      invalidate(["listScrims"]);
      toast({ title: "Scrim deleted." });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }
  async function handleSetScrimResult(id: string) {
    try {
      await authFetch(`/scrims/${id}/result`, { method: "POST", body: JSON.stringify({ result: scrimResult, status: "completed" }) });
      invalidate(["listScrims"]);
      toast({ title: `Result recorded: ${scrimResult.toUpperCase()}` });
      setScrimResultId(null);
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  // ── Events actions ──
  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventForm.title || !eventForm.description || !eventForm.eventDate) return;
    try {
      await authFetch("/events", { method: "POST", body: JSON.stringify({ ...eventForm, imageUrl: eventForm.imageUrl || undefined }) });
      loadEvents();
      toast({ title: "Event created!" });
      setEventForm({ title: "", description: "", imageUrl: "", eventDate: "" });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }
  async function handleDeleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    try {
      await authFetch(`/events/${id}`, { method: "DELETE" });
      loadEvents();
      toast({ title: "Event deleted." });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }
  async function handleUpdateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!editEventId) return;
    try {
      await authFetch(`/events/${editEventId}`, { method: "PATCH", body: JSON.stringify({ ...editEventForm, imageUrl: editEventForm.imageUrl || null }) });
      loadEvents();
      toast({ title: "Event updated!" });
      setEditEventId(null);
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  // ── Feed actions ──
  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!feedForm.content.trim()) return;
    try {
      await authFetch("/feed", { method: "POST", body: JSON.stringify({ ...feedForm, imageUrl: feedForm.imageUrl || undefined }) });
      loadFeed();
      toast({ title: "Post published!" });
      setFeedForm({ content: "", imageUrl: "", postType: "news" });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }
  async function handleDeletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    try {
      await authFetch(`/feed/${id}`, { method: "DELETE" });
      loadFeed();
      toast({ title: "Post deleted." });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  // ── Media actions ──
  async function handleUploadMedia(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaForm.title || !mediaForm.imageUrl) return;
    try {
      await authFetch("/media", { method: "POST", body: JSON.stringify(mediaForm) });
      loadMedia();
      toast({ title: "Media added!" });
      setMediaForm({ title: "", imageUrl: "", category: "clan_life" });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }
  async function handleDeleteMedia(id: string) {
    if (!confirm("Remove this media?")) return;
    try {
      await authFetch(`/media/${id}`, { method: "DELETE" });
      loadMedia();
      toast({ title: "Removed." });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  // ── Broadcast ──
  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    setBroadcastSending(true);
    try {
      await authFetch("/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: broadcastForm.title,
          message: broadcastForm.message,
          targetRole: broadcastForm.targetRole === "ALL" ? null : broadcastForm.targetRole,
        }),
      });
      toast({ title: "Broadcast sent to all members!" });
      setBroadcastForm({ title: "", message: "", targetRole: "ALL" });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setBroadcastSending(false); }
  }

  const pendingCount = pending?.length ?? 0;
  const displayMembers = (allMembers.length > 0 ? allMembers : (activeMembers ?? [])) as MemberExt[];
  const filteredMembers = displayMembers.filter(m =>
    !memberSearch ||
    m.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.codmUsername.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const statsDialogMember = statsDialogId ? displayMembers.find(m => m.id === statsDialogId) : null;
  const roleDialogMember = roleDialogId ? displayMembers.find(m => m.id === roleDialogId) : null;
  const badgesDialogMember = badgesDialogId ? displayMembers.find(m => m.id === badgesDialogId) : null;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
            <Settings2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">CLAN CONTROL CENTER</h1>
            <p className="text-white/40 text-sm">Administration · {member?.role} · {member?.displayName}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5">
          <div className="flex gap-1.5 min-w-max sm:flex-wrap sm:min-w-0">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${tab === t.id ? "bg-red-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"}`}>
                <t.icon className="w-4 h-4 shrink-0" />
                {t.label}
                {t.id === "applications" && pendingCount > 0 && (
                  <span className="bg-white/25 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ─── DASHBOARD ──────────────────────────────────────────────────── */}
        {tab === "dashboard" && (
          <div className="space-y-5">
            <SectionHeader title="Clan Dashboard" subtitle="Live statistics for SOLOS+ ESPORTZ" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard icon={Users} label="Active Members" value={stats?.activeMembers ?? 0} color="text-green-400" />
              <StatCard icon={Clock} label="Pending" value={stats?.pendingMembers ?? 0} color="text-yellow-400" />
              <StatCard icon={Trophy} label="Scrim Wins" value={stats?.scrimWins ?? 0} color="text-yellow-400" />
              <StatCard icon={Target} label="Avg K/D" value={stats?.avgKd?.toFixed(2) ?? "0.00"} color="text-red-400" />
              <StatCard icon={Swords} label="Scrims Played" value={stats?.totalScrims ?? 0} color="text-blue-400" />
              <StatCard icon={Crown} label="Tier 1 Elite" value={stats?.tier1Count ?? 0} color="text-red-400" />
              <StatCard icon={Star} label="Total MVPs" value={stats?.totalMvps ?? 0} color="text-purple-400" />
              <StatCard icon={Activity} label="Clan Points" value={(stats?.totalClanPoints ?? 0).toLocaleString()} color="text-orange-400" />
              <StatCard icon={Users} label="Online Now" value={stats?.membersOnline ?? 0} color="text-green-400" />
            </div>

            <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
              <h3 className="font-bold text-white/60 text-xs uppercase tracking-widest mb-4">Tier Distribution</h3>
              <div className="space-y-2.5">
                {ROLES.map(r => {
                  const count = (activeMembers ?? []).filter(m => m.role === r).length;
                  const total = Math.max((activeMembers ?? []).length, 1);
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={r} className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border text-center w-[90px] shrink-0 ${ROLE_COLORS[r]}`}>{r}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-red-500/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-white/40 w-5 text-right shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top performers */}
            {(activeMembers ?? []).length > 0 && (
              <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                <h3 className="font-bold text-white/60 text-xs uppercase tracking-widest mb-4">Top Performers</h3>
                <div className="space-y-2">
                  {[...(activeMembers ?? [])].sort((a, b) => b.clanPoints - a.clanPoints).slice(0, 5).map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3 py-1.5">
                      <span className={`text-sm font-black w-5 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-white/30"}`}>#{i+1}</span>
                      <div className="w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center text-red-400 text-xs font-black shrink-0">
                        {m.displayName.replace(/^S²十/, "").slice(0,2).toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm font-bold text-white truncate">{m.displayName}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[m.role]}`}>{m.role}</span>
                      <span className="text-sm font-black text-yellow-400 min-w-[50px] text-right">{m.clanPoints.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── APPLICATIONS ───────────────────────────────────────────────── */}
        {tab === "applications" && (
          <div className="space-y-4">
            <SectionHeader title="Pending Applications" subtitle="Review and approve new clan applications" />
            {pendingLoading ? <div className="text-center py-16 text-white/30 animate-pulse">Loading...</div>
              : pendingError ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0" /><p className="text-sm">Failed to load applications.</p>
                </div>
              ) : !pending?.length ? (
                <div className="flex flex-col items-center py-16 text-white/30 gap-3">
                  <UserCheck className="w-12 h-12 opacity-20" />
                  <p className="font-semibold">No pending applications</p><p className="text-xs">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map(m => {
                    const approving = processingIds.has(`approve-${m.id}`);
                    const rejecting = processingIds.has(`reject-${m.id}`);
                    return (
                      <div key={m.id} className="bg-white/4 border border-white/8 hover:border-red-500/15 rounded-2xl overflow-hidden transition-colors">
                        <div className="p-4 flex items-start gap-3">
                          <div className="w-11 h-11 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center text-red-400 font-black text-sm shrink-0">
                            {m.displayName.replace(/^S²十/, "").slice(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-white text-sm">{m.displayName}</div>
                            <div className="text-xs text-white/50 mt-0.5">CODM: {m.codmUsername}</div>
                            {m.whatsappNumber && <div className="text-xs text-green-400 mt-0.5">📱 {m.whatsappNumber}</div>}
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => handleApprove(m.id, m.displayName)} disabled={approving || rejecting}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-500/12 hover:bg-green-500/22 text-green-400 border border-green-500/20 text-xs font-bold disabled:opacity-50 transition-colors">
                              {approving ? <Spinner /> : <UserCheck className="w-3.5 h-3.5" />}
                              <span className="hidden sm:inline">Approve</span>
                            </button>
                            <button onClick={() => handleReject(m.id, m.displayName)} disabled={approving || rejecting}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/12 hover:bg-red-500/22 text-red-400 border border-red-500/20 text-xs font-bold disabled:opacity-50 transition-colors">
                              {rejecting ? <Spinner /> : <UserX className="w-3.5 h-3.5" />}
                              <span className="hidden sm:inline">Reject</span>
                            </button>
                          </div>
                        </div>
                        <div className="border-t border-white/6 px-4 py-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-white/50">
                            <Mail className="w-3 h-3 text-blue-400 shrink-0" /><span className="truncate">{m.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-white/50">
                            <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                            <span>{new Date(m.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        {/* ─── MEMBERS ────────────────────────────────────────────────────── */}
        {tab === "members" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text" value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Search members..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/40"
                />
              </div>
              <button onClick={loadAllMembers} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-white/30 px-1">{filteredMembers.length} members</div>

            {allMembersLoading && <div className="text-center py-10 text-white/30 animate-pulse">Loading members...</div>}

            <div className="space-y-2">
              {filteredMembers.map(m => {
                const isSuspended = m.status === "suspended";
                const isKicked = m.status === "kicked";
                const isExpanded = expandedMember === m.id;

                return (
                  <div key={m.id} className={`border rounded-2xl overflow-hidden transition-colors ${isSuspended ? "border-yellow-500/20 bg-yellow-500/5" : isKicked ? "border-red-500/20 bg-red-500/5 opacity-60" : "border-white/8 bg-white/[0.03] hover:border-white/14"}`}>
                    <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer" onClick={() => setExpandedMember(isExpanded ? null : m.id)}>
                      <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/15 flex items-center justify-center text-red-400 text-xs font-black shrink-0">
                        {m.displayName.replace(/^S²十/, "").slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm truncate max-w-[120px] sm:max-w-none">{m.displayName}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[m.role] ?? ""}`}>{m.role}</span>
                          {m.customTag && <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded-full">{m.customTag}</span>}
                          {isSuspended && <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded-full">SUSPENDED</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-white/35">{m.codmUsername}</span>
                          <span className="text-[10px] text-white/25">KD: {(m.kdRatio ?? 0).toFixed(2)}</span>
                          <span className="text-[10px] text-yellow-400/60">{m.clanPoints.toLocaleString()} pts</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-white/6 px-4 py-4 space-y-4">
                        {/* Contact info */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-xs text-white/40"><span className="text-white/25">Email: </span>{m.email}</div>
                          {m.whatsappNumber && <div className="text-xs text-green-400">📱 {m.whatsappNumber}</div>}
                          {m.tiktokUsername && <div className="text-xs text-pink-400">🎵 @{m.tiktokUsername}</div>}
                          {m.instagramUsername && <div className="text-xs text-purple-400">📷 @{m.instagramUsername}</div>}
                          {m.discordUsername && <div className="text-xs text-blue-400">🎮 {m.discordUsername}</div>}
                          <div className="text-xs text-white/30">Joined {new Date(m.createdAt).toLocaleDateString("en-GB")}</div>
                        </div>

                        {/* Stats summary */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {[
                            { l: "Kills", v: m.kills ?? 0, c: "text-red-400" },
                            { l: "Deaths", v: m.deaths ?? 0, c: "text-gray-400" },
                            { l: "K/D", v: (m.kdRatio ?? 0).toFixed(2), c: "text-orange-400" },
                            { l: "Wins", v: m.totalWins ?? 0, c: "text-green-400" },
                            { l: "Losses", v: m.totalLosses ?? 0, c: "text-red-400" },
                            { l: "MVPs", v: m.mvpCount ?? 0, c: "text-yellow-400" },
                            { l: "Points", v: m.clanPoints, c: "text-yellow-400" },
                            { l: "Activity", v: m.activityScore ?? 0, c: "text-blue-400" },
                            { l: "Tourn. W", v: m.tournamentWins ?? 0, c: "text-purple-400" },
                            { l: "Scrim W", v: m.scrimWins ?? 0, c: "text-cyan-400" },
                          ].map(s => (
                            <div key={s.l} className="bg-white/4 rounded-lg p-2 text-center">
                              <div className={`text-sm font-black ${s.c}`}>{s.v}</div>
                              <div className="text-[9px] text-white/30 mt-0.5">{s.l}</div>
                            </div>
                          ))}
                        </div>

                        {/* Badges */}
                        {(m.achievements ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {m.achievements.map((a, i) => (
                              <span key={i} className="text-[10px] font-bold bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full">{a}</span>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openStatsDialog(m)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/12 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-bold transition-colors">
                            <Target className="w-3.5 h-3.5" />Edit Stats
                          </button>
                          <button onClick={() => openRoleDialog(m)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/12 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs font-bold transition-colors">
                            <Crown className="w-3.5 h-3.5" />Change Role
                          </button>
                          <button onClick={() => openBadgesDialog(m)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/12 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 text-xs font-bold transition-colors">
                            <Award className="w-3.5 h-3.5" />Badges
                          </button>
                          {!isSuspended && m.status !== "kicked" && (
                            <button onClick={() => handleSuspend(m.id, m.displayName)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/12 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 text-xs font-bold transition-colors">
                              <Ban className="w-3.5 h-3.5" />Suspend
                            </button>
                          )}
                          {isSuspended && (
                            <button onClick={() => handleRestore(m.id, m.displayName)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/12 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-bold transition-colors">
                              <RefreshCw className="w-3.5 h-3.5" />Restore
                            </button>
                          )}
                          <button onClick={() => handleKick(m.id, m.displayName)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/12 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />Kick
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── ANNOUNCEMENTS ──────────────────────────────────────────────── */}
        {tab === "announcements" && (
          <div className="space-y-5">
            {/* Create form */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
              <h3 className="font-black text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-red-400" />New Announcement</h3>
              <form onSubmit={handleCreateAnn} className="space-y-3">
                <TextInput value={annForm.title} onChange={v => setAnnForm(f => ({ ...f, title: v }))} placeholder="Title..." />
                <textarea value={annForm.content} onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Announcement content..." rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20" />
                <div className="flex gap-3 items-center flex-wrap">
                  <select value={annForm.type} onChange={e => setAnnForm(f => ({ ...f, type: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                    {ANN_TYPES.map(t => <option key={t} value={t} className="bg-[#0a0a0e]">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                    <input type="checkbox" checked={annForm.pinned} onChange={e => setAnnForm(f => ({ ...f, pinned: e.target.checked }))} className="accent-red-500" />
                    Pin to top
                  </label>
                  <button type="submit" disabled={createAnn.isPending} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                    {createAnn.isPending ? <Spinner /> : <Send className="w-3.5 h-3.5" />} Post
                  </button>
                </div>
              </form>
            </div>

            {/* Announcement list */}
            <SectionHeader title="All Announcements" subtitle={`${announcements?.length ?? 0} announcements`} />
            {annLoading ? <div className="text-center py-10 text-white/30 animate-pulse">Loading...</div>
              : !announcements?.length ? <div className="text-center py-10 text-white/30">No announcements yet.</div>
              : (
                <div className="space-y-2">
                  {announcements.map(a => (
                    <div key={a.id} className={`bg-white/[0.03] border rounded-xl overflow-hidden ${a.pinned ? "border-yellow-500/25" : "border-white/8"}`}>
                      <div className="flex items-start gap-3 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {a.pinned && <Pin className="w-3 h-3 text-yellow-400 shrink-0" />}
                            <span className="font-black text-white text-sm">{a.title}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ANN_COLORS[a.type] ?? ""}`}>{a.type}</span>
                          </div>
                          <p className="text-xs text-white/55 leading-relaxed line-clamp-2">{a.content}</p>
                          <p className="text-[10px] text-white/25 mt-1.5">By {a.authorName} · {new Date(a.createdAt).toLocaleDateString("en-GB")}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => handlePinAnn(a.id, a.pinned)} className={`p-1.5 rounded-lg transition-colors ${a.pinned ? "text-yellow-400 bg-yellow-400/10" : "text-white/30 hover:text-yellow-400 hover:bg-yellow-400/10"}`}>
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteAnn(a.id)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ─── EVENTS ─────────────────────────────────────────────────────── */}
        {tab === "events" && (
          <div className="space-y-5">
            {/* Create form */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
              <h3 className="font-black text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-red-400" />Create Event</h3>
              <form onSubmit={handleCreateEvent} className="space-y-3">
                <TextInput value={eventForm.title} onChange={v => setEventForm(f => ({ ...f, title: v }))} placeholder="Event title..." />
                <textarea value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Event description..." rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-500/40" />
                <TextInput value={eventForm.imageUrl} onChange={v => setEventForm(f => ({ ...f, imageUrl: v }))} placeholder="Image URL (optional)..." />
                <TextInput value={eventForm.eventDate} onChange={v => setEventForm(f => ({ ...f, eventDate: v }))} type="datetime-local" />
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors">
                  <Calendar className="w-3.5 h-3.5" /> Create Event
                </button>
              </form>
            </div>

            {/* Events list */}
            <SectionHeader title="All Events" subtitle={`${events.length} events`} />
            {eventsLoading ? <div className="text-center py-10 text-white/30 animate-pulse">Loading...</div>
              : !events.length ? <div className="text-center py-10 text-white/30">No events yet.</div>
              : (
                <div className="space-y-2">
                  {events.map(ev => {
                    const isEdit = editEventId === ev.id;
                    return (
                      <div key={ev.id} className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
                        {!isEdit ? (
                          <div className="flex items-start gap-3 p-4">
                            {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} className="w-16 h-16 rounded-lg object-cover shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                            <div className="flex-1 min-w-0">
                              <div className="font-black text-white text-sm">{ev.title}</div>
                              <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{ev.description}</p>
                              <p className="text-xs text-red-400 mt-1 font-bold">
                                {new Date(ev.eventDate).toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short", year:"numeric" })} · {new Date(ev.eventDate).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })}
                              </p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => { setEditEventId(ev.id); setEditEventForm({ title: ev.title, description: ev.description, imageUrl: ev.imageUrl ?? "", eventDate: ev.eventDate.slice(0, 16) }); }}
                                className="p-1.5 rounded-lg text-white/30 hover:text-blue-400 hover:bg-blue-400/10 transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteEvent(ev.id)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handleUpdateEvent} className="p-4 space-y-2">
                            <TextInput value={editEventForm.title} onChange={v => setEditEventForm(f => ({ ...f, title: v }))} placeholder="Title..." />
                            <textarea value={editEventForm.description} onChange={e => setEditEventForm(f => ({ ...f, description: e.target.value }))}
                              rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-500/40" />
                            <TextInput value={editEventForm.imageUrl} onChange={v => setEditEventForm(f => ({ ...f, imageUrl: v }))} placeholder="Image URL..." />
                            <TextInput value={editEventForm.eventDate} onChange={v => setEditEventForm(f => ({ ...f, eventDate: v }))} type="datetime-local" />
                            <div className="flex gap-2">
                              <button type="submit" className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"><Check className="w-3 h-3" />Save</button>
                              <button type="button" onClick={() => setEditEventId(null)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/50 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"><X className="w-3 h-3" />Cancel</button>
                            </div>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        {/* ─── SCRIMS ─────────────────────────────────────────────────────── */}
        {tab === "scrims" && (
          <div className="space-y-5">
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
              <h3 className="font-black text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-red-400" />Schedule Scrim</h3>
              <form onSubmit={handleCreateScrim} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextInput value={scrimForm.opponentName} onChange={v => setScrimForm(f => ({ ...f, opponentName: v }))} placeholder="Opponent clan name..." />
                  <TextInput value={scrimForm.scheduledAt} onChange={v => setScrimForm(f => ({ ...f, scheduledAt: v }))} type="datetime-local" />
                  <TextInput value={scrimForm.gameMode} onChange={v => setScrimForm(f => ({ ...f, gameMode: v }))} placeholder="Game mode..." />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-white/40 shrink-0">Players:</label>
                    <select value={scrimForm.requiredPlayers} onChange={e => setScrimForm(f => ({ ...f, requiredPlayers: e.target.value }))}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                      {[2,3,4,5,6,7,8,10].map(n => <option key={n} value={n} className="bg-[#0a0a0e]">{n} players</option>)}
                    </select>
                  </div>
                </div>
                <TextInput value={scrimForm.notes} onChange={v => setScrimForm(f => ({ ...f, notes: v }))} placeholder="Notes (optional)..." />
                <button type="submit" disabled={createScrim.isPending} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                  {createScrim.isPending ? <Spinner /> : <Swords className="w-3.5 h-3.5" />} Schedule
                </button>
              </form>
            </div>

            <SectionHeader title="All Scrims" subtitle={`${scrims?.length ?? 0} scrims`} />
            {scrimsLoading ? <div className="text-center py-10 text-white/30 animate-pulse">Loading...</div>
              : !scrims?.length ? <div className="text-center py-10 text-white/30">No scrims scheduled.</div>
              : (
                <div className="space-y-2">
                  {scrims.map(s => {
                    const statusColors: Record<string, string> = { upcoming: "text-blue-400 bg-blue-400/10 border-blue-400/20", ongoing: "text-green-400 bg-green-400/10 border-green-400/20", completed: "text-white/40 bg-white/5 border-white/15", cancelled: "text-red-400 bg-red-400/10 border-red-400/20" };
                    const resultColors: Record<string, string> = { win: "text-green-400", loss: "text-red-400", draw: "text-yellow-400" };
                    return (
                      <div key={s.id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-black text-white text-sm">vs {s.opponentName}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${statusColors[s.status] ?? ""}`}>{s.status}</span>
                              {s.result && <span className={`text-[10px] font-black ${resultColors[s.result] ?? ""}`}>{s.result.toUpperCase()}</span>}
                            </div>
                            <div className="text-xs text-white/45 flex gap-3 flex-wrap">
                              <span>{new Date(s.scheduledAt).toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" })} · {new Date(s.scheduledAt).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })}</span>
                              <span className="text-blue-400/70">{s.gameMode}</span>
                              <span>{s.requiredPlayers}v{s.requiredPlayers}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {s.status === "upcoming" && (
                              <button onClick={() => setScrimResultId(s.id)} className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-green-500/12 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors flex items-center gap-1">
                                <Trophy className="w-3 h-3" />Result
                              </button>
                            )}
                            <button onClick={() => handleDeleteScrim(s.id, s.opponentName)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {scrimResultId === s.id && (
                          <div className="mt-3 pt-3 border-t border-white/6 flex items-center gap-2">
                            <span className="text-xs text-white/40">Record result:</span>
                            {(["win","loss","draw"] as const).map(r => (
                              <button key={r} onClick={() => setScrimResult(r)}
                                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${scrimResult === r ? (r === "win" ? "bg-green-500/20 text-green-400 border-green-500/30" : r === "loss" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30") : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"}`}>
                                {r.toUpperCase()}
                              </button>
                            ))}
                            <button onClick={() => handleSetScrimResult(s.id)} className="ml-auto px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1">
                              <Check className="w-3 h-3" />Confirm
                            </button>
                            <button onClick={() => setScrimResultId(null)} className="p-1 text-white/30 hover:text-white/60">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        {/* ─── LEADERBOARD / STATS EDITOR ─────────────────────────────────── */}
        {tab === "leaderboard" && (
          <div className="space-y-4">
            <SectionHeader title="Stats Editor" subtitle="Edit individual player stats — changes update the leaderboard immediately" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type="text" value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                placeholder="Search player..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/40" />
            </div>
            {allMembersLoading ? <div className="text-center py-10 text-white/30 animate-pulse">Loading...</div>
              : (
                <div className="space-y-2">
                  {filteredMembers.filter(m => m.status === "active").map(m => (
                    <div key={m.id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center text-red-400 text-xs font-black shrink-0">
                        {m.displayName.replace(/^S²十/, "").slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{m.displayName}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[m.role] ?? ""}`}>{m.role}</span>
                        </div>
                        <div className="flex gap-3 mt-0.5 text-[10px] text-white/35">
                          <span>KD: <b className="text-orange-400">{(m.kdRatio ?? 0).toFixed(2)}</b></span>
                          <span>Pts: <b className="text-yellow-400">{m.clanPoints}</b></span>
                          <span>Kills: <b className="text-red-400">{m.kills ?? 0}</b></span>
                          <span>W: <b className="text-green-400">{m.totalWins ?? 0}</b></span>
                        </div>
                      </div>
                      <button onClick={() => openStatsDialog(m)} className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5">
                        <Edit2 className="w-3 h-3" />Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ─── GALLERY & FEED ─────────────────────────────────────────────── */}
        {tab === "gallery" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setGalleryTab("gallery")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${galleryTab === "gallery" ? "bg-red-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"}`}>
                <Image className="w-4 h-4" />Gallery
              </button>
              <button onClick={() => setGalleryTab("feed")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${galleryTab === "feed" ? "bg-red-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"}`}>
                <Flame className="w-4 h-4" />Social Feed
              </button>
            </div>

            {galleryTab === "gallery" && (
              <div className="space-y-5">
                <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
                  <h3 className="font-black text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-red-400" />Add to Gallery</h3>
                  <form onSubmit={handleUploadMedia} className="space-y-3">
                    <TextInput value={mediaForm.title} onChange={v => setMediaForm(f => ({ ...f, title: v }))} placeholder="Title or description..." />
                    <TextInput value={mediaForm.imageUrl} onChange={v => setMediaForm(f => ({ ...f, imageUrl: v }))} placeholder="Image URL (direct link)..." />
                    <div className="flex gap-3 items-center">
                      <select value={mediaForm.category} onChange={e => setMediaForm(f => ({ ...f, category: e.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                        {MEDIA_CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-[#0a0a0e]">{c.label}</option>)}
                      </select>
                      <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors">
                        <Camera className="w-3.5 h-3.5" />Add
                      </button>
                    </div>
                  </form>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {media.map(item => (
                    <div key={item.id} className="relative rounded-xl overflow-hidden bg-white/4 border border-white/8 aspect-square group">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col gap-2">
                        <p className="text-xs font-bold text-white text-center px-2 line-clamp-2">{item.title}</p>
                        <button onClick={() => handleDeleteMedia(item.id)} className="p-1.5 rounded-lg bg-red-500/30 text-red-400 hover:bg-red-500/50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {media.length === 0 && <div className="col-span-3 text-center py-10 text-white/30">No media in gallery yet.</div>}
                </div>
              </div>
            )}

            {galleryTab === "feed" && (
              <div className="space-y-4">
                <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
                  <h3 className="font-black text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-red-400" />New Post</h3>
                  <form onSubmit={handleCreatePost} className="space-y-3">
                    <textarea value={feedForm.content} onChange={e => setFeedForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="Write post content..." rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-500/40" />
                    <TextInput value={feedForm.imageUrl} onChange={v => setFeedForm(f => ({ ...f, imageUrl: v }))} placeholder="Image URL (optional)..." />
                    <div className="flex gap-3 items-center">
                      <select value={feedForm.postType} onChange={e => setFeedForm(f => ({ ...f, postType: e.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                        {FEED_POST_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#0a0a0e]">{t.label}</option>)}
                      </select>
                      <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors">
                        <Send className="w-3.5 h-3.5" />Post
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-2">
                  {feed.map(post => (
                    <div key={post.id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-white">{post.authorName}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ANN_COLORS[post.postType] ?? "bg-white/5 text-white/40 border-white/15"}`}>{post.postType}</span>
                          <Heart className="w-3 h-3 text-red-400/60 ml-auto" />
                          <span className="text-xs text-white/40">{post.likeCount}</span>
                        </div>
                        <p className="text-xs text-white/60 line-clamp-2">{post.content}</p>
                        {post.imageUrl && <img src={post.imageUrl} alt="post" className="w-20 h-12 rounded-lg object-cover mt-2" />}
                      </div>
                      <button onClick={() => handleDeletePost(post.id)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {feed.length === 0 && <div className="text-center py-10 text-white/30">No posts yet.</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── BROADCAST / SETTINGS ──────────────────────────────────────── */}
        {tab === "settings" && (
          <div className="space-y-5">
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
              <h3 className="font-black text-white mb-1 flex items-center gap-2"><Send className="w-4 h-4 text-blue-400" />Broadcast Notification</h3>
              <p className="text-xs text-white/40 mb-5">Send a notification to all or specific tier members instantly.</p>
              <form onSubmit={handleBroadcast} className="space-y-3">
                <TextInput value={broadcastForm.title} onChange={v => setBroadcastForm(f => ({ ...f, title: v }))} placeholder="Notification title..." />
                <textarea value={broadcastForm.message} onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Message content..." rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-500/40" />
                <div className="flex gap-3 items-center flex-wrap">
                  <select value={broadcastForm.targetRole} onChange={e => setBroadcastForm(f => ({ ...f, targetRole: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                    <option value="ALL" className="bg-[#0a0a0e]">All Members</option>
                    {ROLES.map(r => <option key={r} value={r} className="bg-[#0a0a0e]">{r}</option>)}
                  </select>
                  <button type="submit" disabled={broadcastSending} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                    {broadcastSending ? <Spinner /> : <Send className="w-3.5 h-3.5" />}
                    Send Broadcast
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
              <h3 className="font-black text-white mb-3">Clan Info</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-white/40">Clan Tag: </span><span className="text-red-400 font-bold">S²十</span></div>
                <div><span className="text-white/40">Game: </span><span className="text-white font-bold">CODM BR</span></div>
                <div><span className="text-white/40">Platform: </span><span className="text-white font-bold">SOLOS+ ESPORTZ</span></div>
                <div><span className="text-white/40">Members: </span><span className="text-white font-bold">{stats?.activeMembers ?? 0} Active</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── STATS DIALOG ────────────────────────────────────────────────────── */}
      {statsDialogId && statsDialogMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0d0d12] border border-white/12 rounded-2xl w-full max-w-sm overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-white/8">
              <div>
                <h3 className="font-black text-white">Edit Stats</h3>
                <p className="text-xs text-white/40">{statsDialogMember.displayName}</p>
              </div>
              <button onClick={() => setStatsDialogId(null)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateStats} className="p-5 space-y-3">
              {[
                { key: "kills", label: "Kills", icon: "💀", color: "text-red-400" },
                { key: "deaths", label: "Deaths", icon: "💀", color: "text-gray-400" },
                { key: "kdRatio", label: "K/D Ratio", icon: "🎯", color: "text-orange-400", step: "0.01" },
                { key: "totalWins", label: "Total Wins", icon: "🏆", color: "text-green-400" },
                { key: "totalLosses", label: "Total Losses", icon: "❌", color: "text-red-400" },
                { key: "mvpCount", label: "MVP Count", icon: "⭐", color: "text-yellow-400" },
                { key: "clanPoints", label: "Clan Points", icon: "💎", color: "text-yellow-400" },
                { key: "activityScore", label: "Activity Score", icon: "🔥", color: "text-blue-400" },
                { key: "tournamentWins", label: "Tournament Wins", icon: "🏅", color: "text-purple-400" },
                { key: "scrimWins", label: "Scrim Wins", icon: "⚔️", color: "text-cyan-400" },
              ].map(f => (
                <div key={f.key}>
                  <label className={`text-xs font-bold ${f.color} block mb-1`}>{f.icon} {f.label}</label>
                  <input
                    type="number" step={(f as any).step ?? "1"} min="0"
                    value={statsForm[f.key as keyof typeof statsForm]}
                    onChange={e => setStatsForm(s => ({ ...s, [f.key]: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />Save Stats
                </button>
                <button type="button" onClick={() => setStatsDialogId(null)} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/50 font-bold text-sm rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ROLE DIALOG ─────────────────────────────────────────────────────── */}
      {roleDialogId && roleDialogMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0d0d12] border border-white/12 rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-white/8">
              <div>
                <h3 className="font-black text-white">Change Role</h3>
                <p className="text-xs text-white/40">{roleDialogMember.displayName}</p>
              </div>
              <button onClick={() => setRoleDialogId(null)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/8"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button key={r} onClick={() => setSelectedRole(r)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${selectedRole === r ? `${ROLE_COLORS[r]} ring-1 ring-current` : "border-white/8 bg-white/5 text-white/40 hover:bg-white/10"}`}>
                    {r}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Custom Tag (optional)</label>
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="e.g. Sniper King, IGL..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-500/40" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleRoleChange} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors">
                  Confirm
                </button>
                <button onClick={() => setRoleDialogId(null)} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/50 font-bold text-sm rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BADGES DIALOG ───────────────────────────────────────────────────── */}
      {badgesDialogId && badgesDialogMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0d0d12] border border-white/12 rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-white/8">
              <div><h3 className="font-black text-white">Manage Badges</h3><p className="text-xs text-white/40">{badgesDialogMember.displayName}</p></div>
              <button onClick={() => setBadgesDialogId(null)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/8"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {PRESET_BADGES.map(badge => {
                  const active = badgesInput.includes(badge);
                  return (
                    <button key={badge} onClick={() => setBadgesInput(b => active ? b.filter(x => x !== badge) : [...b, badge])}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-colors ${active ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/30" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"}`}>
                      {badge}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveBadges} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                  <Award className="w-4 h-4" />Save Badges
                </button>
                <button onClick={() => setBadgesDialogId(null)} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/50 font-bold text-sm rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
