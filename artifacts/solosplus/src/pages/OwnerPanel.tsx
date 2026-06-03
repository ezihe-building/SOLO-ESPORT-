import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  UserCheck, UserX, ChevronLeft, Lock, Crown, Users, Shield, RefreshCw, LogOut,
  Phone, Mail, Calendar, Tag, X, Check, Edit3, BarChart2, Megaphone, Plus,
  Trash2, Pin, Send, TrendingUp, Ban, RotateCcw, Award, Image, Flame, Music2,
  MessageCircle, ChevronDown, ChevronUp, Upload, Link2, ExternalLink, Swords,
  Trophy, Eye, Camera,
} from "lucide-react";

const API = `${(import.meta as any).env?.VITE_API_URL ?? ""}/api`;
const WA_LINK = "https://chat.whatsapp.com/JGkaBobItjVKhlpbQAvaX8?mode=gi_t";
const TT_LINK = "https://www.tiktok.com/@solosesportz?_r=1&_t=ZS-96nBUlDDxdl";

const ROLES = ["OWNER", "MANAGEMENT", "TIER1", "TIER2", "TIER3", "NEW_MEMBER"] as const;
type Role = typeof ROLES[number];

const ROLE_COLORS: Record<string, string> = {
  OWNER: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  MANAGEMENT: "text-purple-400 border-purple-400/40 bg-purple-400/10",
  TIER1: "text-red-400 border-red-400/40 bg-red-400/10",
  TIER2: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  TIER3: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  NEW_MEMBER: "text-gray-400 border-gray-400/40 bg-gray-400/10",
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-400 bg-green-400/10",
  suspended: "text-orange-400 bg-orange-400/10",
  kicked: "text-red-400 bg-red-400/10",
  rejected: "text-red-400 bg-red-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
};

const ANN_TYPES = ["general", "scrim", "tournament", "promotion", "meeting", "urgent"] as const;
const ANN_COLORS: Record<string, string> = {
  general: "bg-blue-400/10 text-blue-400",
  scrim: "bg-green-400/10 text-green-400",
  tournament: "bg-yellow-400/10 text-yellow-400",
  promotion: "bg-purple-400/10 text-purple-400",
  meeting: "bg-orange-400/10 text-orange-400",
  urgent: "bg-red-400/10 text-red-400",
};

const PRESET_BADGES = [
  "👑 Clan Master","🛡️ Admin","🔥 Tier 1 Elite","⚡ Tier 2 Warrior",
  "🎯 Tier 3 Recruit","🏅 Veteran","🏆 Tournament Winner","⭐ MVP",
  "💬 WhatsApp Member","🎵 TikTok Creator","💀 Top Fragger","🌟 Clan Legend",
];

const FEED_TYPES = ["news","tournament","achievement","screenshot","promotion","highlight","scrim_result"];
const MEDIA_CATS = ["scrim","tournament","event","achievement","clan_life"];
const GAME_MODES = ["Battle Royale","Multiplayer","Ranked BR","Ranked MP","Blitz","Sniper Challenge"];
const SCRIM_STATUSES = ["upcoming","ongoing","completed","cancelled"] as const;

const TABS = [
  { id:"dashboard",     label:"Dashboard",     icon:BarChart2 },
  { id:"applications",  label:"Applications",  icon:UserCheck },
  { id:"members",       label:"Members",       icon:Users },
  { id:"stats",         label:"Stats Editor",  icon:TrendingUp },
  { id:"badges",        label:"Badges",        icon:Award },
  { id:"announcements", label:"Announcements", icon:Megaphone },
  { id:"events",        label:"Events",        icon:Calendar },
  { id:"scrims",        label:"Scrims",        icon:Swords },
  { id:"feed",          label:"Gallery & Feed",icon:Image },
  { id:"broadcast",     label:"Broadcast",     icon:Send },
] as const;
type TabId = typeof TABS[number]["id"];

interface Member {
  id:string; displayName:string; codmUsername:string; email:string;
  role:string; status:string; customTag:string|null; whatsappNumber:string|null;
  tiktokUsername:string|null; instagramUsername:string|null; discordUsername:string|null;
  avatarUrl:string|null; createdAt:string; clanPoints:number; kills:number; deaths:number;
  kdRatio:number; totalWins:number; totalLosses:number; mvpCount:number; activityScore:number;
  tournamentWins:number; scrimWins:number; achievements:string[];
}
interface Announcement {
  id:string; title:string; content:string; type:string; pinned:boolean; authorName:string;
  imageUrl:string|null; linkUrl:string|null; linkLabel:string|null; createdAt:string;
}
interface EventItem {
  id:string; title:string; description:string; imageUrl:string|null;
  linkUrl:string|null; linkLabel:string|null; eventDate:string; createdByName:string;
}
interface FeedPost {
  id:string; authorName:string; authorRole:string; content:string; imageUrl:string|null; postType:string; likeCount:number; createdAt:string;
}
interface MediaItem { id:string; title:string; imageUrl:string; category:string; uploadedByName:string; createdAt:string; }
interface Scrim {
  id:string; opponentName:string; scheduledAt:string; gameMode:string; requiredPlayers:number;
  status:string; result:string|null; notes:string|null; imageUrl:string|null;
  linkUrl:string|null; linkLabel:string|null; resultImageUrl:string|null;
}
interface ClanStats { total:number; pending:number; active:number; rejected:number; kicked:number; suspended:number; byRole:Record<string,number>; }

async function mf(path:string, options:RequestInit={}, pwd:string) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers:{"Content-Type":"application/json","x-mgmt-password":pwd,...(options.headers??{})},
  });
  if (res.status===204) return null;
  const body = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error((body as any).error??"Request failed");
  return body;
}

function Avatar({name,url,size="md"}:{name:string;url?:string|null;size?:"sm"|"md"|"lg"}) {
  const initials = name.replace(/^S²十/,"").slice(0,2).toUpperCase();
  const sz={sm:"w-8 h-8 text-xs",md:"w-11 h-11 text-sm",lg:"w-14 h-14 text-base"}[size];
  if (url) return <img src={url} alt={name} className={`${sz} rounded-full object-cover border border-red-500/30 shrink-0`} onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />;
  return <div className={`${sz} rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black shrink-0`}>{initials}</div>;
}
function Toast({msg}:{msg:string}) {
  return <div className="fixed top-4 right-4 z-50 bg-[#111] border border-white/10 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl">{msg}</div>;
}
function Inp({value,onChange,placeholder,type="text",className=""}:{value:string;onChange:(v:string)=>void;placeholder?:string;type?:string;className?:string}) {
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className={`w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/40 ${className}`} />;
}
function TA({value,onChange,placeholder,rows=3}:{value:string;onChange:(v:string)=>void;placeholder?:string;rows?:number}) {
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/40 resize-none" />;
}

function FileUploadBtn({pwd,bucket,onUrl,label="Upload Image",className=""}:{pwd:string;bucket:string;onUrl:(url:string)=>void;label?:string;className?:string}) {
  const [uploading,setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  async function handleFile(e:React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch(`${API}/upload`,{
          method:"POST",
          headers:{"Content-Type":"application/json","x-mgmt-password":pwd},
          body:JSON.stringify({base64,filename:file.name,bucket}),
        });
        if (res.ok){const {url}=await res.json();onUrl(url);}
      } finally { setUploading(false); if(ref.current)ref.current.value=""; }
    };
    reader.readAsDataURL(file);
  }
  return (
    <>
      <input ref={ref} type="file" accept="image/*,video/mp4" onChange={handleFile} className="hidden" />
      <button type="button" onClick={()=>ref.current?.click()} disabled={uploading}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-bold transition-colors disabled:opacity-50 ${className}`}>
        {uploading?<span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"/>:<Upload className="w-3 h-3"/>}
        {uploading?"Uploading...":label}
      </button>
    </>
  );
}

export default function OwnerPanel() {
  const [pwd,setPwd]=useState(""); const [inputPwd,setInputPwd]=useState(""); const [pwdError,setPwdError]=useState(""); const [authed,setAuthed]=useState(false);
  const [tab,setTab]=useState<TabId>("dashboard"); const [toast,setToast]=useState<string|null>(null); const [loading,setLoading]=useState(false); const [mobileTabOpen,setMobileTabOpen]=useState(false);

  // Data
  const [clanStats,setClanStats]=useState<ClanStats|null>(null);
  const [pending,setPending]=useState<Member[]>([]);
  const [allMembers,setAllMembers]=useState<Member[]>([]);
  const [announcements,setAnnouncements]=useState<Announcement[]>([]);
  const [events,setEvents]=useState<EventItem[]>([]);
  const [feed,setFeed]=useState<FeedPost[]>([]);
  const [media,setMedia]=useState<MediaItem[]>([]);
  const [scrims,setScrims]=useState<Scrim[]>([]);

  // Member UI
  const [expandedId,setExpandedId]=useState<string|null>(null);
  const [roleDialogId,setRoleDialogId]=useState<string|null>(null);
  const [selectedRole,setSelectedRole]=useState<Role>("TIER3");
  const [roleTag,setRoleTag]=useState("");
  const [statsDialogId,setStatsDialogId]=useState<string|null>(null);
  const [statsForm,setStatsForm]=useState({kills:"0",deaths:"0",kdRatio:"0.00",totalWins:"0",totalLosses:"0",mvpCount:"0",clanPoints:"0",activityScore:"0",tournamentWins:"0",scrimWins:"0"});
  const [badgesDialogId,setBadgesDialogId]=useState<string|null>(null);
  const [badgesInput,setBadgesInput]=useState<string[]>([]);
  const [customBadge,setCustomBadge]=useState("");

  // Announcement form
  const [annForm,setAnnForm]=useState({title:"",content:"",type:"general",pinned:false,imageUrl:"",linkUrl:"",linkLabel:""});
  const [editAnnId,setEditAnnId]=useState<string|null>(null);
  const [editAnnForm,setEditAnnForm]=useState({title:"",content:"",type:"general",pinned:false,imageUrl:"",linkUrl:"",linkLabel:""});

  // Event form
  const [eventForm,setEventForm]=useState({title:"",description:"",imageUrl:"",linkUrl:"",linkLabel:"",eventDate:""});
  const [editEventId,setEditEventId]=useState<string|null>(null);
  const [editEventForm,setEditEventForm]=useState({title:"",description:"",imageUrl:"",linkUrl:"",linkLabel:"",eventDate:""});

  // Scrim form
  const [scrimForm,setScrimForm]=useState({opponentName:"",scheduledAt:"",gameMode:"Battle Royale",requiredPlayers:"5",notes:"",imageUrl:"",linkUrl:"",linkLabel:""});
  const [editScrimId,setEditScrimId]=useState<string|null>(null);
  const [editScrimForm,setEditScrimForm]=useState({opponentName:"",scheduledAt:"",gameMode:"Battle Royale",requiredPlayers:"5",notes:"",imageUrl:"",linkUrl:"",linkLabel:"",status:"upcoming"});
  const [resultDialogId,setResultDialogId]=useState<string|null>(null);
  const [resultChoice,setResultChoice]=useState<"win"|"loss"|"draw">("win");
  const [resultImageUrl,setResultImageUrl]=useState("");

  // Feed/Gallery
  const [feedForm,setFeedForm]=useState({content:"",imageUrl:"",postType:"news"});
  const [mediaForm,setMediaForm]=useState({title:"",imageUrl:"",category:"clan_life"});
  const [galleryTab,setGalleryTab]=useState<"gallery"|"feed">("gallery");

  // Broadcast
  const [broadcastForm,setBroadcastForm]=useState({title:"",message:"",targetRole:"ALL"});
  const [broadcastSending,setBroadcastSending]=useState(false);

  const showToast=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(null),3500);};

  const loadStats=useCallback(async(p:string)=>{try{const d=await mf("/mgmt/stats",{},p);setClanStats(d);}catch{}},[]); // eslint-disable-line
  const loadPending=useCallback(async(p:string)=>{try{const d=await mf("/mgmt/pending",{},p);setPending(d??[]);}catch{}},[]);
  const loadMembers=useCallback(async(p:string)=>{try{const d=await mf("/mgmt/all-members",{},p);setAllMembers(d??[]);}catch{}},[]);
  const loadAnn=useCallback(async(p:string)=>{try{const d=await mf("/mgmt/announcements",{},p);setAnnouncements(d??[]);}catch{}},[]);
  const loadEvents=useCallback(async(p:string)=>{try{const d=await mf("/mgmt/events",{},p);setEvents(d??[]);}catch{}},[]);
  const loadFeed=useCallback(async(p:string)=>{try{const d=await mf("/mgmt/feed",{},p);setFeed(d??[]);}catch{}},[]);
  const loadMedia=useCallback(async(p:string)=>{try{const d=await mf("/mgmt/media",{},p);setMedia(d??[]);}catch{}},[]);
  const loadScrims=useCallback(async(p:string)=>{try{const d=await mf("/mgmt/scrims",{},p);setScrims(d??[]);}catch{}},[]);
  const loadAll=useCallback(async(p:string)=>{setLoading(true);await Promise.all([loadStats(p),loadPending(p),loadMembers(p)]);setLoading(false);},[loadStats,loadPending,loadMembers]);

  useEffect(()=>{
    if (!authed) return;
    if (tab==="dashboard"){loadStats(pwd);loadPending(pwd);}
    if (tab==="applications") loadPending(pwd);
    if (tab==="members"||tab==="stats"||tab==="badges") loadMembers(pwd);
    if (tab==="announcements") loadAnn(pwd);
    if (tab==="events") loadEvents(pwd);
    if (tab==="scrims") loadScrims(pwd);
    if (tab==="feed"){loadFeed(pwd);loadMedia(pwd);}
  },[tab,authed]); // eslint-disable-line

  const handleUnlock=async(e:React.FormEvent)=>{
    e.preventDefault();setPwdError("");
    try{await mf("/mgmt/stats",{},inputPwd);setPwd(inputPwd);setAuthed(true);loadAll(inputPwd);}
    catch{setPwdError("Incorrect password. Access denied.");}
  };

  if (!authed) return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.06]" style={{backgroundImage:"url('/clan-logo.jpg')",filter:"blur(20px)",transform:"scale(1.1)"}} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 rounded-2xl bg-red-600/20 blur-xl scale-125" />
            <img src="/clan-logo.jpg" alt="SOLOS+" className="relative w-28 h-28 mx-auto rounded-2xl object-cover border-2 border-red-500/40 shadow-[0_0_40px_rgba(220,38,38,0.3)]" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-red-400 uppercase tracking-[0.3em] font-bold">Restricted Access</span>
          </div>
          <h1 className="text-2xl font-black tracking-widest text-white">OWNER PANEL</h1>
          <p className="text-sm text-white/35 mt-1">SOLOS+ ESPORTZ Management</p>
        </div>
        <form onSubmit={handleUnlock} className="space-y-4">
          <input type="password" value={inputPwd} onChange={e=>setInputPwd(e.target.value)} placeholder="Enter management password"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-red-500/60 text-center tracking-widest" autoFocus />
          {pwdError&&<p className="text-red-400 text-xs text-center">{pwdError}</p>}
          <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-black tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Crown className="w-4 h-4" /> UNLOCK ACCESS
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/"><span className="text-white/30 hover:text-white/60 text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"><ChevronLeft className="w-3 h-3" /> Back to website</span></Link>
        </div>
      </div>
    </div>
  );

  const activeMembers=allMembers.filter(m=>m.status==="active");
  const currentTab=TABS.find(t=>t.id===tab)!;

  return (
    <div className="min-h-screen bg-[#060608] text-white flex flex-col">
      {toast&&<Toast msg={toast}/>}

      {/* Header */}
      <header className="border-b border-white/8 bg-black/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/clan-logo.jpg" alt="SOLOS+" className="w-9 h-9 rounded-lg object-cover border border-red-500/30 shrink-0"/>
            <div><span className="font-black tracking-wider">OWNER PANEL</span><div className="text-[10px] text-red-400 tracking-widest">SOLOS+ ESPORTZ</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>loadAll(pwd)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading?"animate-spin":""}`}/> Refresh
            </button>
            <button onClick={()=>{setAuthed(false);setPwd("");setInputPwd("");}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-xs text-white/60 hover:text-red-400 transition-colors">
              <LogOut className="w-3.5 h-3.5"/> Lock
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="hidden md:flex w-52 shrink-0 border-r border-white/6 flex-col py-4 gap-1 px-2 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left w-full ${tab===t.id?"bg-red-600/20 text-red-400 border border-red-500/25":"text-white/45 hover:bg-white/5 hover:text-white"}`}>
              <t.icon className="w-4 h-4 shrink-0"/>{t.label}
              {t.id==="applications"&&pending.length>0&&<span className="ml-auto bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{pending.length}</span>}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {/* Mobile tab picker */}
          <div className="md:hidden mb-4">
            <button onClick={()=>setMobileTabOpen(o=>!o)} className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold">
              <span className="flex items-center gap-2"><currentTab.icon className="w-4 h-4 text-red-400"/>{currentTab.label}</span>
              {mobileTabOpen?<ChevronUp className="w-4 h-4 text-white/40"/>:<ChevronDown className="w-4 h-4 text-white/40"/>}
            </button>
            {mobileTabOpen&&(
              <div className="mt-1 bg-[#0e0e14] border border-white/10 rounded-xl overflow-hidden">
                {TABS.map(t=>(
                  <button key={t.id} onClick={()=>{setTab(t.id);setMobileTabOpen(false);}}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold transition-colors border-b border-white/5 last:border-0 ${tab===t.id?"bg-red-600/15 text-red-400":"text-white/55 hover:bg-white/5"}`}>
                    <t.icon className="w-4 h-4 shrink-0"/>{t.label}
                    {t.id==="applications"&&pending.length>0&&<span className="ml-auto bg-red-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5">{pending.length}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── DASHBOARD ─── */}
          {tab==="dashboard"&&(
            <div className="space-y-5">
              <h2 className="text-xl font-black">Dashboard Overview</h2>
              {clanStats&&(
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[{label:"Total",value:clanStats.total,color:"text-white"},{label:"Pending",value:clanStats.pending,color:"text-yellow-400"},{label:"Active",value:clanStats.active,color:"text-green-400"},{label:"Suspended",value:clanStats.suspended,color:"text-orange-400"},{label:"Kicked",value:clanStats.kicked,color:"text-red-400"},{label:"Rejected",value:clanStats.rejected,color:"text-red-300"}].map(s=>(
                    <div key={s.label} className="bg-white/4 border border-white/8 rounded-xl p-4 text-center">
                      <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {clanStats&&<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(clanStats.byRole).map(([role,count])=>(
                  <div key={role} className={`border rounded-xl p-3 flex items-center gap-3 ${ROLE_COLORS[role]??"text-gray-400 border-gray-400/20 bg-gray-400/5"}`}>
                    <div className="text-xl font-black">{count}</div><div className="text-xs font-bold opacity-70">{role}</div>
                  </div>
                ))}
              </div>}
              {pending.length>0&&<div className="bg-yellow-400/8 border border-yellow-400/20 rounded-2xl p-4">
                <p className="text-yellow-400 font-bold flex items-center gap-2"><UserCheck className="w-4 h-4"/>{pending.length} pending application{pending.length!==1?"s":""}</p>
                <button onClick={()=>setTab("applications")} className="mt-2 text-sm text-yellow-400/70 hover:text-yellow-400 transition-colors">Review now →</button>
              </div>}
              <div className="grid sm:grid-cols-2 gap-3">
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-green-500/8 border border-green-500/20 rounded-xl hover:bg-green-500/14 transition-colors">
                  <MessageCircle className="w-6 h-6 text-green-400 shrink-0"/>
                  <div><div className="font-bold text-white text-sm">WhatsApp Community</div><div className="text-xs text-white/40">Join official clan group</div></div>
                </a>
                <a href={TT_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-pink-500/8 border border-pink-500/20 rounded-xl hover:bg-pink-500/14 transition-colors">
                  <Music2 className="w-6 h-6 text-pink-400 shrink-0"/>
                  <div><div className="font-bold text-white text-sm">TikTok Page</div><div className="text-xs text-white/40">@solosesportz</div></div>
                </a>
              </div>
            </div>
          )}

          {/* ─── APPLICATIONS ─── */}
          {tab==="applications"&&(
            <div className="space-y-4">
              <h2 className="text-xl font-black">Pending Applications <span className="text-white/30 font-normal text-base">({pending.length})</span></h2>
              {pending.length===0?<div className="flex flex-col items-center justify-center py-20 text-white/25 gap-3"><UserCheck className="w-14 h-14 opacity-20"/><p className="text-lg font-semibold">No pending applications</p></div>
              :pending.map(m=>(
                <div key={m.id} className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
                  <div className="p-4 flex items-center gap-4">
                    <Avatar name={m.displayName} url={m.avatarUrl} size="lg"/>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-lg">{m.displayName}</div>
                      <div className="text-sm text-white/45">CODM: {m.codmUsername}</div>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <button onClick={async()=>{try{await mf(`/mgmt/approve/${m.id}`,{method:"POST"},pwd);showToast(`✓ ${m.displayName} approved!`);loadPending(pwd);loadStats(pwd);}catch{showToast("Failed");}}}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/12 hover:bg-green-500/25 text-green-400 border border-green-500/20 font-bold text-sm transition-colors">
                        <UserCheck className="w-4 h-4"/> Approve
                      </button>
                      <button onClick={async()=>{try{await mf(`/mgmt/reject/${m.id}`,{method:"POST"},pwd);showToast(`${m.displayName} rejected.`);loadPending(pwd);loadStats(pwd);}catch{showToast("Failed");}}}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/12 hover:bg-red-500/25 text-red-400 border border-red-500/20 font-bold text-sm transition-colors">
                        <UserX className="w-4 h-4"/> Reject
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-white/6 px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-white/50">
                    <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-green-400"/>{m.whatsappNumber??"No WhatsApp"}</span>
                    <span className="flex items-center gap-1.5"><Mail className="w-3 h-3"/>{m.email}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3"/>{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── MEMBERS ─── */}
          {tab==="members"&&(
            <div className="space-y-3">
              <h2 className="text-xl font-black">All Members <span className="text-white/30 font-normal text-base">({allMembers.length})</span></h2>
              {allMembers.map(m=>(
                <div key={m.id} className="bg-white/4 border border-white/8 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <Avatar name={m.displayName} url={m.avatarUrl} size="sm"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm truncate">{m.displayName}</span>
                        <span className={`text-[10px] font-bold border rounded-full px-1.5 py-0.5 ${ROLE_COLORS[m.role]??""}`}>{m.role}</span>
                        <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${STATUS_COLORS[m.status]??"text-white/40"}`}>{m.status}</span>
                        {m.customTag&&<span className="text-[10px] text-cyan-400 bg-cyan-400/8 border border-cyan-400/20 rounded-full px-1.5 py-0.5">{m.customTag}</span>}
                      </div>
                      <div className="text-xs text-white/35 mt-0.5">{m.email}</div>
                    </div>
                    <button onClick={()=>setExpandedId(expandedId===m.id?null:m.id)} className="p-1.5 text-white/30 hover:text-white transition-colors">
                      {expandedId===m.id?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}
                    </button>
                  </div>
                  {expandedId===m.id&&(
                    <div className="border-t border-white/6 p-3 flex flex-wrap gap-2">
                      <button onClick={()=>{setRoleDialogId(m.id);setSelectedRole(m.role as Role);setRoleTag(m.customTag??"");}}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold border border-white/8 transition-colors">
                        <Shield className="w-3 h-3"/> Change Role
                      </button>
                      {m.status==="active"&&<button onClick={async()=>{const reason=prompt(`Reason for suspending ${m.displayName}:`);if(reason===null)return;try{await mf(`/mgmt/suspend/${m.id}`,{method:"POST",body:JSON.stringify({reason})},pwd);showToast(`${m.displayName} suspended.`);loadMembers(pwd);}catch{showToast("Failed");}}}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/15 transition-colors">
                        <Ban className="w-3 h-3"/> Suspend
                      </button>}
                      {m.status==="suspended"&&<button onClick={async()=>{try{await mf(`/mgmt/restore/${m.id}`,{method:"POST"},pwd);showToast(`${m.displayName} restored!`);loadMembers(pwd);}catch{showToast("Failed");}}}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/15 transition-colors">
                        <RotateCcw className="w-3 h-3"/> Restore
                      </button>}
                      <button onClick={async()=>{if(!confirm(`Kick ${m.displayName}?`))return;try{await mf(`/mgmt/kick/${m.id}`,{method:"POST"},pwd);showToast(`${m.displayName} kicked.`);loadMembers(pwd);}catch{showToast("Failed");}}}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/15 transition-colors">
                        <UserX className="w-3 h-3"/> Kick
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ─── STATS ─── */}
          {tab==="stats"&&(
            <div className="space-y-3">
              <h2 className="text-xl font-black">Stats Editor</h2>
              <p className="text-white/40 text-sm">Click Edit to update a member's combat statistics.</p>
              {activeMembers.map(m=>(
                <div key={m.id} className="bg-white/4 border border-white/8 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={m.displayName} url={m.avatarUrl} size="sm"/>
                    <div className="flex-1"><div className="font-bold text-sm">{m.displayName}</div><span className={`text-[10px] font-bold border rounded-full px-1.5 py-0.5 ${ROLE_COLORS[m.role]??""}`}>{m.role}</span></div>
                    <button onClick={()=>{setStatsDialogId(m.id);setStatsForm({kills:String(m.kills??0),deaths:String(m.deaths??0),kdRatio:(m.kdRatio??0).toFixed(2),totalWins:String(m.totalWins??0),totalLosses:String(m.totalLosses??0),mvpCount:String(m.mvpCount??0),clanPoints:String(m.clanPoints??0),activityScore:String(m.activityScore??0),tournamentWins:String(m.tournamentWins??0),scrimWins:String(m.scrimWins??0)});}}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 text-red-400 text-xs font-bold border border-red-500/20 transition-colors">
                      <Edit3 className="w-3 h-3"/> Edit Stats
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[{label:"Kills",value:m.kills??0,color:"text-red-400"},{label:"Deaths",value:m.deaths??0,color:"text-gray-400"},{label:"K/D",value:(m.kdRatio??0).toFixed(2),color:"text-orange-400"},{label:"Wins",value:m.totalWins??0,color:"text-green-400"},{label:"Points",value:m.clanPoints??0,color:"text-yellow-400"}].map(s=>(
                      <div key={s.label} className="bg-white/3 rounded-lg p-2 text-center"><div className={`text-sm font-black ${s.color}`}>{s.value}</div><div className="text-[10px] text-white/35">{s.label}</div></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── BADGES ─── */}
          {tab==="badges"&&(
            <div className="space-y-3">
              <h2 className="text-xl font-black">Badge Manager</h2>
              {activeMembers.map(m=>(
                <div key={m.id} className="bg-white/4 border border-white/8 rounded-xl p-4 flex items-center gap-3">
                  <Avatar name={m.displayName} url={m.avatarUrl} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{m.displayName}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(m.achievements??[]).length===0?<span className="text-xs text-white/25 italic">No badges yet</span>
                      :(m.achievements??[]).map((b,i)=><span key={i} className="text-[10px] font-bold bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-1.5 py-0.5 rounded-md">{b}</span>)}
                    </div>
                  </div>
                  <button onClick={()=>{setBadgesDialogId(m.id);setBadgesInput([...(m.achievements??[])]);}}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/18 text-yellow-400 text-xs font-bold border border-yellow-400/20 transition-colors shrink-0">
                    <Award className="w-3 h-3"/> Edit
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ─── ANNOUNCEMENTS ─── */}
          {tab==="announcements"&&(
            <div className="space-y-5">
              <h2 className="text-xl font-black">Announcements</h2>

              {/* Create form */}
              <div className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">New Announcement</p>
                <Inp value={annForm.title} onChange={v=>setAnnForm(f=>({...f,title:v}))} placeholder="Title"/>
                <TA value={annForm.content} onChange={v=>setAnnForm(f=>({...f,content:v}))} placeholder="Content..."/>
                {/* Image */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileUploadBtn pwd={pwd} bucket="announcements" onUrl={url=>setAnnForm(f=>({...f,imageUrl:url}))} label="Upload Image"/>
                    <span className="text-white/25 text-xs">or paste URL:</span>
                    <div className="flex-1 min-w-0"><Inp value={annForm.imageUrl} onChange={v=>setAnnForm(f=>({...f,imageUrl:v}))} placeholder="https://..." /></div>
                  </div>
                  {annForm.imageUrl&&<img src={annForm.imageUrl} alt="preview" className="w-full max-h-40 object-cover rounded-xl border border-white/8"/>}
                </div>
                {/* Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Link URL (optional)</label>
                    <Inp value={annForm.linkUrl} onChange={v=>setAnnForm(f=>({...f,linkUrl:v}))} placeholder="https://..."/>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Link Label</label>
                    <Inp value={annForm.linkLabel} onChange={v=>setAnnForm(f=>({...f,linkLabel:v}))} placeholder="e.g. Register Now"/>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap items-center">
                  <select value={annForm.type} onChange={e=>setAnnForm(f=>({...f,type:e.target.value}))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                    {ANN_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer">
                    <input type="checkbox" checked={annForm.pinned} onChange={e=>setAnnForm(f=>({...f,pinned:e.target.checked}))} className="rounded"/> Pin
                  </label>
                  <button onClick={async()=>{if(!annForm.title||!annForm.content)return;try{await mf("/mgmt/announcements",{method:"POST",body:JSON.stringify({...annForm,imageUrl:annForm.imageUrl||undefined,linkUrl:annForm.linkUrl||undefined,linkLabel:annForm.linkLabel||undefined})},pwd);showToast("Posted!");setAnnForm({title:"",content:"",type:"general",pinned:false,imageUrl:"",linkUrl:"",linkLabel:""});loadAnn(pwd);}catch{showToast("Failed");}}}
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors">
                    <Plus className="w-3.5 h-3.5"/> Post
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2">
                {announcements.map(a=>(
                  <div key={a.id} className="bg-white/4 border border-white/8 rounded-xl overflow-hidden">
                    {editAnnId===a.id?(
                      <div className="p-4 space-y-3">
                        <Inp value={editAnnForm.title} onChange={v=>setEditAnnForm(f=>({...f,title:v}))} placeholder="Title"/>
                        <TA value={editAnnForm.content} onChange={v=>setEditAnnForm(f=>({...f,content:v}))} placeholder="Content"/>
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileUploadBtn pwd={pwd} bucket="announcements" onUrl={url=>setEditAnnForm(f=>({...f,imageUrl:url}))} label="Upload Image"/>
                          <div className="flex-1 min-w-0"><Inp value={editAnnForm.imageUrl} onChange={v=>setEditAnnForm(f=>({...f,imageUrl:v}))} placeholder="Image URL"/></div>
                        </div>
                        {editAnnForm.imageUrl&&<img src={editAnnForm.imageUrl} className="w-full max-h-32 object-cover rounded-xl border border-white/8"/>}
                        <div className="grid sm:grid-cols-2 gap-2">
                          <Inp value={editAnnForm.linkUrl} onChange={v=>setEditAnnForm(f=>({...f,linkUrl:v}))} placeholder="Link URL"/>
                          <Inp value={editAnnForm.linkLabel} onChange={v=>setEditAnnForm(f=>({...f,linkLabel:v}))} placeholder="Link Label"/>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <select value={editAnnForm.type} onChange={e=>setEditAnnForm(f=>({...f,type:e.target.value}))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                            {ANN_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                          </select>
                          <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer"><input type="checkbox" checked={editAnnForm.pinned} onChange={e=>setEditAnnForm(f=>({...f,pinned:e.target.checked}))} className="rounded"/> Pinned</label>
                          <button onClick={async()=>{try{await mf(`/mgmt/announcements/${a.id}`,{method:"PATCH",body:JSON.stringify({...editAnnForm,imageUrl:editAnnForm.imageUrl||null,linkUrl:editAnnForm.linkUrl||null,linkLabel:editAnnForm.linkLabel||null})},pwd);showToast("Updated!");setEditAnnId(null);loadAnn(pwd);}catch{showToast("Failed");}}}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-bold text-xs rounded-lg border border-green-500/20">
                            <Check className="w-3 h-3"/> Save
                          </button>
                          <button onClick={()=>setEditAnnId(null)} className="px-3 py-1.5 bg-white/5 text-white/40 font-bold text-xs rounded-lg border border-white/8">Cancel</button>
                        </div>
                      </div>
                    ):(
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {a.pinned&&<Pin className="w-4 h-4 text-red-400 shrink-0 mt-0.5"/>}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${ANN_COLORS[a.type]??""}`}>{a.type.toUpperCase()}</span>
                              <span className="font-bold text-sm text-white">{a.title}</span>
                            </div>
                            <p className="text-xs text-white/50 mb-2">{a.content}</p>
                            {a.imageUrl&&<img src={a.imageUrl} alt="announcement" className="w-full max-h-48 object-cover rounded-xl border border-white/8 mb-2"/>}
                            {a.linkUrl&&<a href={a.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-400/10 border border-blue-400/20 px-3 py-1.5 rounded-lg transition-colors font-bold"><ExternalLink className="w-3 h-3"/>{a.linkLabel||"Open Link"}</a>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={()=>{setEditAnnId(a.id);setEditAnnForm({title:a.title,content:a.content,type:a.type,pinned:a.pinned,imageUrl:a.imageUrl??"",linkUrl:a.linkUrl??"",linkLabel:a.linkLabel??""});}}
                              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"><Edit3 className="w-3.5 h-3.5"/></button>
                            <button onClick={async()=>{try{await mf(`/mgmt/announcements/${a.id}`,{method:"PATCH",body:JSON.stringify({pinned:!a.pinned})},pwd);loadAnn(pwd);}catch{showToast("Failed");}}}
                              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"><Pin className="w-3.5 h-3.5"/></button>
                            <button onClick={async()=>{if(!confirm("Delete?"))return;try{await mf(`/mgmt/announcements/${a.id}`,{method:"DELETE"},pwd);loadAnn(pwd);}catch{showToast("Failed");}}}
                              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── EVENTS ─── */}
          {tab==="events"&&(
            <div className="space-y-5">
              <h2 className="text-xl font-black">Events</h2>
              <div className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Create Event</p>
                <Inp value={eventForm.title} onChange={v=>setEventForm(f=>({...f,title:v}))} placeholder="Event title"/>
                <TA value={eventForm.description} onChange={v=>setEventForm(f=>({...f,description:v}))} placeholder="Description..."/>
                <div className="flex items-center gap-2 flex-wrap">
                  <FileUploadBtn pwd={pwd} bucket="events" onUrl={url=>setEventForm(f=>({...f,imageUrl:url}))} label="Upload Banner"/>
                  <div className="flex-1 min-w-0"><Inp value={eventForm.imageUrl} onChange={v=>setEventForm(f=>({...f,imageUrl:v}))} placeholder="Image URL (optional)"/></div>
                </div>
                {eventForm.imageUrl&&<img src={eventForm.imageUrl} className="w-full max-h-40 object-cover rounded-xl border border-white/8"/>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Inp value={eventForm.linkUrl} onChange={v=>setEventForm(f=>({...f,linkUrl:v}))} placeholder="Link URL (optional)"/>
                  <Inp value={eventForm.linkLabel} onChange={v=>setEventForm(f=>({...f,linkLabel:v}))} placeholder="Link Label (e.g. Register)"/>
                </div>
                <div className="flex gap-3">
                  <input type="datetime-local" value={eventForm.eventDate} onChange={e=>setEventForm(f=>({...f,eventDate:e.target.value}))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/40"/>
                  <button onClick={async()=>{if(!eventForm.title||!eventForm.description||!eventForm.eventDate)return;try{await mf("/mgmt/events",{method:"POST",body:JSON.stringify({...eventForm,imageUrl:eventForm.imageUrl||undefined,linkUrl:eventForm.linkUrl||undefined,linkLabel:eventForm.linkLabel||undefined,eventDate:new Date(eventForm.eventDate).toISOString()})},pwd);showToast("Event created!");setEventForm({title:"",description:"",imageUrl:"",linkUrl:"",linkLabel:"",eventDate:""});loadEvents(pwd);}catch{showToast("Failed");}}}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors">
                    <Plus className="w-3.5 h-3.5"/> Create
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {events.map(ev=>(
                  <div key={ev.id} className="bg-white/4 border border-white/8 rounded-xl p-4">
                    {editEventId===ev.id?(
                      <div className="space-y-2">
                        <Inp value={editEventForm.title} onChange={v=>setEditEventForm(f=>({...f,title:v}))} placeholder="Title"/>
                        <TA value={editEventForm.description} onChange={v=>setEditEventForm(f=>({...f,description:v}))} placeholder="Description"/>
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileUploadBtn pwd={pwd} bucket="events" onUrl={url=>setEditEventForm(f=>({...f,imageUrl:url}))} label="Upload Banner"/>
                          <div className="flex-1 min-w-0"><Inp value={editEventForm.imageUrl} onChange={v=>setEditEventForm(f=>({...f,imageUrl:v}))} placeholder="Image URL"/></div>
                        </div>
                        {editEventForm.imageUrl&&<img src={editEventForm.imageUrl} className="w-full max-h-32 object-cover rounded-xl border border-white/8"/>}
                        <div className="grid sm:grid-cols-2 gap-2">
                          <Inp value={editEventForm.linkUrl} onChange={v=>setEditEventForm(f=>({...f,linkUrl:v}))} placeholder="Link URL"/>
                          <Inp value={editEventForm.linkLabel} onChange={v=>setEditEventForm(f=>({...f,linkLabel:v}))} placeholder="Link Label"/>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={async()=>{try{await mf(`/mgmt/events/${ev.id}`,{method:"PATCH",body:JSON.stringify({...editEventForm,imageUrl:editEventForm.imageUrl||null,linkUrl:editEventForm.linkUrl||null,linkLabel:editEventForm.linkLabel||null,eventDate:editEventForm.eventDate?new Date(editEventForm.eventDate).toISOString():undefined})},pwd);showToast("Updated!");setEditEventId(null);loadEvents(pwd);}catch{showToast("Failed");}}}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-bold text-xs rounded-lg border border-green-500/20"><Check className="w-3 h-3"/> Save</button>
                          <button onClick={()=>setEditEventId(null)} className="px-3 py-1.5 bg-white/5 text-white/40 font-bold text-xs rounded-lg border border-white/8">Cancel</button>
                        </div>
                      </div>
                    ):(
                      <div className="flex items-start gap-3">
                        {ev.imageUrl&&<img src={ev.imageUrl} alt={ev.title} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"/>}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm">{ev.title}</div>
                          <p className="text-xs text-white/45 mt-0.5 line-clamp-2">{ev.description}</p>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            <p className="text-xs text-white/30 flex items-center gap-1"><Calendar className="w-3 h-3"/>{new Date(ev.eventDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</p>
                            {ev.linkUrl&&<a href={ev.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-lg font-bold"><ExternalLink className="w-2.5 h-2.5"/>{ev.linkLabel||"Link"}</a>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={()=>{setEditEventId(ev.id);setEditEventForm({title:ev.title,description:ev.description,imageUrl:ev.imageUrl??"",linkUrl:ev.linkUrl??"",linkLabel:ev.linkLabel??"",eventDate:""});}}
                            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"><Edit3 className="w-3.5 h-3.5"/></button>
                          <button onClick={async()=>{if(!confirm("Delete?"))return;try{await mf(`/mgmt/events/${ev.id}`,{method:"DELETE"},pwd);loadEvents(pwd);}catch{showToast("Failed");}}}
                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── SCRIMS ─── */}
          {tab==="scrims"&&(
            <div className="space-y-5">
              <h2 className="text-xl font-black">Scrim Manager</h2>

              {/* Create form */}
              <div className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Schedule Scrim</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Inp value={scrimForm.opponentName} onChange={v=>setScrimForm(f=>({...f,opponentName:v}))} placeholder="Opponent clan name"/>
                  <select value={scrimForm.gameMode} onChange={e=>setScrimForm(f=>({...f,gameMode:e.target.value}))} className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none">
                    {GAME_MODES.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                  <input type="datetime-local" value={scrimForm.scheduledAt} onChange={e=>setScrimForm(f=>({...f,scheduledAt:e.target.value}))} className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"/>
                  <Inp value={scrimForm.requiredPlayers} onChange={v=>setScrimForm(f=>({...f,requiredPlayers:v}))} placeholder="Players required" type="number"/>
                </div>
                <TA value={scrimForm.notes} onChange={v=>setScrimForm(f=>({...f,notes:v}))} placeholder="Notes (optional)..." rows={2}/>
                {/* Image */}
                <div className="flex items-center gap-2 flex-wrap">
                  <FileUploadBtn pwd={pwd} bucket="scrims" onUrl={url=>setScrimForm(f=>({...f,imageUrl:url}))} label="Upload Image"/>
                  <div className="flex-1 min-w-0"><Inp value={scrimForm.imageUrl} onChange={v=>setScrimForm(f=>({...f,imageUrl:v}))} placeholder="Image URL (optional)"/></div>
                </div>
                {scrimForm.imageUrl&&<img src={scrimForm.imageUrl} className="w-full max-h-32 object-cover rounded-xl border border-white/8"/>}
                {/* Link */}
                <div className="grid sm:grid-cols-2 gap-2">
                  <Inp value={scrimForm.linkUrl} onChange={v=>setScrimForm(f=>({...f,linkUrl:v}))} placeholder="Link URL (optional)"/>
                  <Inp value={scrimForm.linkLabel} onChange={v=>setScrimForm(f=>({...f,linkLabel:v}))} placeholder="Link Label (e.g. Tournament Page)"/>
                </div>
                <button onClick={async()=>{
                  if(!scrimForm.opponentName||!scrimForm.scheduledAt)return;
                  try{await mf("/mgmt/scrims",{method:"POST",body:JSON.stringify({opponentName:scrimForm.opponentName,scheduledAt:new Date(scrimForm.scheduledAt).toISOString(),gameMode:scrimForm.gameMode,requiredPlayers:Number(scrimForm.requiredPlayers),notes:scrimForm.notes||undefined,imageUrl:scrimForm.imageUrl||undefined,linkUrl:scrimForm.linkUrl||undefined,linkLabel:scrimForm.linkLabel||undefined})},pwd);
                  showToast("Scrim scheduled!");setScrimForm({opponentName:"",scheduledAt:"",gameMode:"Battle Royale",requiredPlayers:"5",notes:"",imageUrl:"",linkUrl:"",linkLabel:""});loadScrims(pwd);}
                  catch{showToast("Failed");}
                }} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors w-fit">
                  <Plus className="w-3.5 h-3.5"/> Schedule
                </button>
              </div>

              {/* Scrim list */}
              <div className="space-y-3">
                {scrims.map(s=>(
                  <div key={s.id} className={`bg-white/4 border rounded-xl overflow-hidden ${s.result==="win"?"border-green-500/25":s.result==="loss"?"border-red-500/25":s.result==="draw"?"border-yellow-500/25":"border-white/8"}`}>
                    {editScrimId===s.id?(
                      <div className="p-4 space-y-2">
                        <div className="grid sm:grid-cols-2 gap-2">
                          <Inp value={editScrimForm.opponentName} onChange={v=>setEditScrimForm(f=>({...f,opponentName:v}))} placeholder="Opponent"/>
                          <select value={editScrimForm.gameMode} onChange={e=>setEditScrimForm(f=>({...f,gameMode:e.target.value}))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white">
                            {GAME_MODES.map(m=><option key={m} value={m}>{m}</option>)}
                          </select>
                          <select value={editScrimForm.status} onChange={e=>setEditScrimForm(f=>({...f,status:e.target.value}))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white">
                            {SCRIM_STATUSES.map(st=><option key={st} value={st}>{st}</option>)}
                          </select>
                          <Inp value={editScrimForm.requiredPlayers} onChange={v=>setEditScrimForm(f=>({...f,requiredPlayers:v}))} placeholder="Players" type="number"/>
                        </div>
                        <TA value={editScrimForm.notes} onChange={v=>setEditScrimForm(f=>({...f,notes:v}))} placeholder="Notes" rows={2}/>
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileUploadBtn pwd={pwd} bucket="scrims" onUrl={url=>setEditScrimForm(f=>({...f,imageUrl:url}))} label="Upload Image"/>
                          <div className="flex-1 min-w-0"><Inp value={editScrimForm.imageUrl} onChange={v=>setEditScrimForm(f=>({...f,imageUrl:v}))} placeholder="Image URL"/></div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <Inp value={editScrimForm.linkUrl} onChange={v=>setEditScrimForm(f=>({...f,linkUrl:v}))} placeholder="Link URL"/>
                          <Inp value={editScrimForm.linkLabel} onChange={v=>setEditScrimForm(f=>({...f,linkLabel:v}))} placeholder="Link Label"/>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={async()=>{try{await mf(`/mgmt/scrims/${s.id}`,{method:"PATCH",body:JSON.stringify({...editScrimForm,imageUrl:editScrimForm.imageUrl||null,linkUrl:editScrimForm.linkUrl||null,linkLabel:editScrimForm.linkLabel||null,requiredPlayers:Number(editScrimForm.requiredPlayers),scheduledAt:editScrimForm.scheduledAt?new Date(editScrimForm.scheduledAt).toISOString():undefined})},pwd);showToast("Updated!");setEditScrimId(null);loadScrims(pwd);}catch{showToast("Failed");}}}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 text-green-400 font-bold text-xs rounded-lg border border-green-500/20"><Check className="w-3 h-3"/> Save</button>
                          <button onClick={()=>setEditScrimId(null)} className="px-3 py-1.5 bg-white/5 text-white/40 font-bold text-xs rounded-lg border border-white/8">Cancel</button>
                        </div>
                      </div>
                    ):(
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {s.imageUrl&&<img src={s.imageUrl} alt="scrim" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"/>}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-bold text-sm">vs {s.opponentName}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.status==="upcoming"?"bg-blue-400/10 text-blue-400":s.status==="completed"?"bg-green-400/10 text-green-400":s.status==="ongoing"?"bg-yellow-400/10 text-yellow-400":"bg-gray-400/10 text-gray-400"}`}>{s.status}</span>
                              {s.result&&<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.result==="win"?"bg-green-500/15 text-green-400":s.result==="loss"?"bg-red-500/15 text-red-400":"bg-yellow-500/15 text-yellow-400"}`}>{s.result.toUpperCase()}</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-white/40">
                              <span>{s.gameMode}</span>
                              <span>·</span>
                              <span>{s.requiredPlayers} players</span>
                              <span>·</span>
                              <span>{new Date(s.scheduledAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} {new Date(s.scheduledAt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</span>
                            </div>
                            {s.notes&&<p className="text-xs text-white/30 mt-1">{s.notes}</p>}
                            {s.linkUrl&&<a href={s.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-lg font-bold"><ExternalLink className="w-2.5 h-2.5"/>{s.linkLabel||"Link"}</a>}
                            {s.resultImageUrl&&<img src={s.resultImageUrl} alt="result" className="mt-2 w-full max-h-40 object-cover rounded-xl border border-white/8"/>}
                          </div>
                          <div className="flex gap-1 shrink-0 flex-col">
                            {s.status!=="completed"&&<button onClick={()=>{setResultDialogId(s.id);setResultChoice("win");setResultImageUrl("");}}
                              className="p-1.5 rounded-lg text-white/30 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors" title="Record Result"><Trophy className="w-3.5 h-3.5"/></button>}
                            <button onClick={()=>{setEditScrimId(s.id);setEditScrimForm({opponentName:s.opponentName,scheduledAt:"",gameMode:s.gameMode,requiredPlayers:String(s.requiredPlayers),notes:s.notes??"",imageUrl:s.imageUrl??"",linkUrl:s.linkUrl??"",linkLabel:s.linkLabel??"",status:s.status});}}
                              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"><Edit3 className="w-3.5 h-3.5"/></button>
                            <button onClick={async()=>{if(!confirm("Delete scrim?"))return;try{await mf(`/mgmt/scrims/${s.id}`,{method:"DELETE"},pwd);loadScrims(pwd);}catch{showToast("Failed");}}}
                              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── GALLERY & FEED ─── */}
          {tab==="feed"&&(
            <div className="space-y-5">
              <h2 className="text-xl font-black">Gallery & Feed</h2>
              <div className="flex gap-2 mb-3">
                {(["gallery","feed"] as const).map(gt=>(
                  <button key={gt} onClick={()=>setGalleryTab(gt)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${galleryTab===gt?"bg-red-600 text-white":"bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"}`}>
                    {gt==="gallery"?<span className="flex items-center gap-2"><Image className="w-4 h-4"/> Gallery</span>:<span className="flex items-center gap-2"><Flame className="w-4 h-4"/> Feed Posts</span>}
                  </button>
                ))}
              </div>

              {galleryTab==="gallery"&&(
                <>
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Upload Media</p>
                    <Inp value={mediaForm.title} onChange={v=>setMediaForm(f=>({...f,title:v}))} placeholder="Title"/>
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileUploadBtn pwd={pwd} bucket="gallery" onUrl={url=>setMediaForm(f=>({...f,imageUrl:url}))} label="Upload Image"/>
                      <div className="flex-1 min-w-0"><Inp value={mediaForm.imageUrl} onChange={v=>setMediaForm(f=>({...f,imageUrl:v}))} placeholder="Image URL"/></div>
                    </div>
                    {mediaForm.imageUrl&&<img src={mediaForm.imageUrl} className="w-full max-h-40 object-cover rounded-xl border border-white/8"/>}
                    <div className="flex gap-3">
                      <select value={mediaForm.category} onChange={e=>setMediaForm(f=>({...f,category:e.target.value}))} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                        {MEDIA_CATS.map(c=><option key={c} value={c}>{c.replace("_"," ")}</option>)}
                      </select>
                      <button onClick={async()=>{if(!mediaForm.title||!mediaForm.imageUrl)return;try{await mf("/mgmt/media",{method:"POST",body:JSON.stringify(mediaForm)},pwd);showToast("Added!");setMediaForm({title:"",imageUrl:"",category:"clan_life"});loadMedia(pwd);}catch{showToast("Failed");}}}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl"><Plus className="w-3.5 h-3.5"/> Add</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {media.map(item=>(
                      <div key={item.id} className="relative group rounded-xl overflow-hidden border border-white/8">
                        <img src={item.imageUrl} alt={item.title} className="w-full aspect-square object-cover"/>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-2">
                          <p className="text-xs font-bold text-white truncate w-full text-center">{item.title}</p>
                          <button onClick={async()=>{if(!confirm("Remove?"))return;try{await mf(`/mgmt/media/${item.id}`,{method:"DELETE"},pwd);loadMedia(pwd);}catch{showToast("Failed");}}}
                            className="mt-1 p-1.5 bg-red-600/80 rounded-lg text-white"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {galleryTab==="feed"&&(
                <>
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">New Post</p>
                    <TA value={feedForm.content} onChange={v=>setFeedForm(f=>({...f,content:v}))} placeholder="What's happening in the clan..."/>
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileUploadBtn pwd={pwd} bucket="feed" onUrl={url=>setFeedForm(f=>({...f,imageUrl:url}))} label="Upload Image"/>
                      <div className="flex-1 min-w-0"><Inp value={feedForm.imageUrl} onChange={v=>setFeedForm(f=>({...f,imageUrl:v}))} placeholder="Image URL (optional)"/></div>
                    </div>
                    {feedForm.imageUrl&&<img src={feedForm.imageUrl} className="w-full max-h-40 object-cover rounded-xl border border-white/8"/>}
                    <div className="flex gap-3">
                      <select value={feedForm.postType} onChange={e=>setFeedForm(f=>({...f,postType:e.target.value}))} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                        {FEED_TYPES.map(t=><option key={t} value={t}>{t.replace("_"," ")}</option>)}
                      </select>
                      <button onClick={async()=>{if(!feedForm.content)return;try{await mf("/mgmt/feed",{method:"POST",body:JSON.stringify({...feedForm,imageUrl:feedForm.imageUrl||undefined})},pwd);showToast("Posted!");setFeedForm({content:"",imageUrl:"",postType:"news"});loadFeed(pwd);}catch{showToast("Failed");}}}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl"><Send className="w-3.5 h-3.5"/> Post</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {feed.map(post=>(
                      <div key={post.id} className="bg-white/4 border border-white/8 rounded-xl p-4 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-white">{post.authorName}</span>
                            <span className="text-[10px] bg-white/8 text-white/40 rounded-md px-1.5 py-0.5">{post.postType.replace("_"," ")}</span>
                          </div>
                          <p className="text-xs text-white/60 line-clamp-2">{post.content}</p>
                          {post.imageUrl&&<img src={post.imageUrl} className="mt-2 w-full max-h-32 object-cover rounded-xl border border-white/8"/>}
                        </div>
                        <button onClick={async()=>{if(!confirm("Delete?"))return;try{await mf(`/mgmt/feed/${post.id}`,{method:"DELETE"},pwd);loadFeed(pwd);}catch{showToast("Failed");}}}
                          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── BROADCAST ─── */}
          {tab==="broadcast"&&(
            <div className="space-y-5 max-w-xl">
              <h2 className="text-xl font-black">Broadcast Notification</h2>
              <p className="text-white/40 text-sm">Send a push notification to all or specific members.</p>
              <div className="bg-white/4 border border-white/8 rounded-2xl p-5 space-y-4">
                <div><label className="text-xs text-white/40 block mb-1.5 uppercase tracking-widest font-bold">Title</label><Inp value={broadcastForm.title} onChange={v=>setBroadcastForm(f=>({...f,title:v}))} placeholder="Notification title"/></div>
                <div><label className="text-xs text-white/40 block mb-1.5 uppercase tracking-widest font-bold">Message</label><TA value={broadcastForm.message} onChange={v=>setBroadcastForm(f=>({...f,message:v}))} placeholder="Your message to the clan..." rows={4}/></div>
                <div>
                  <label className="text-xs text-white/40 block mb-1.5 uppercase tracking-widest font-bold">Send To</label>
                  <select value={broadcastForm.targetRole} onChange={e=>setBroadcastForm(f=>({...f,targetRole:e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none">
                    <option value="ALL">All Members</option>
                    {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button disabled={broadcastSending||!broadcastForm.title||!broadcastForm.message} onClick={async()=>{
                  setBroadcastSending(true);
                  try{const res:any=await mf("/mgmt/broadcast",{method:"POST",body:JSON.stringify(broadcastForm)},pwd);showToast(`Broadcast sent to ${res?.sent??"all"} members!`);setBroadcastForm({title:"",message:"",targetRole:"ALL"});}
                  catch{showToast("Failed to send broadcast");}
                  finally{setBroadcastSending(false);}
                }} className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black tracking-wider rounded-xl transition-colors">
                  {broadcastSending?<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<Send className="w-4 h-4"/>}
                  Send Broadcast
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Role Dialog ── */}
      {roleDialogId&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0e0e12] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4"><h3 className="font-black text-lg">Change Role</h3><button onClick={()=>setRoleDialogId(null)} className="text-white/30 hover:text-white"><X className="w-5 h-5"/></button></div>
            <div className="grid gap-2 mb-4">
              {ROLES.map(r=>(
                <button key={r} onClick={()=>setSelectedRole(r)} className={`px-4 py-2.5 rounded-xl text-sm font-bold border text-left flex items-center justify-between transition-colors ${selectedRole===r?ROLE_COLORS[r]:"bg-white/3 border-white/8 text-white/50 hover:bg-white/8"}`}>
                  <span>{r}</span>{selectedRole===r&&<Check className="w-4 h-4"/>}
                </button>
              ))}
            </div>
            <div className="mb-4"><label className="text-xs text-white/40 block mb-1.5">Custom Tag (optional)</label><Inp value={roleTag} onChange={setRoleTag} placeholder="e.g. Clan Master, Sniper"/></div>
            <div className="flex gap-2">
              <button onClick={async()=>{try{await mf(`/mgmt/role/${roleDialogId}`,{method:"POST",body:JSON.stringify({role:selectedRole,customTag:roleTag.trim()||null})},pwd);showToast(`Role → ${selectedRole}`);setRoleDialogId(null);loadMembers(pwd);}catch{showToast("Failed");}}}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-colors">Save</button>
              <button onClick={()=>setRoleDialogId(null)} className="px-4 py-2.5 bg-white/5 text-white/40 font-bold rounded-xl border border-white/8">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Dialog ── */}
      {statsDialogId&&(()=>{
        const m=activeMembers.find(x=>x.id===statsDialogId);if(!m)return null;
        return(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0e0e12] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4"><div><h3 className="font-black text-lg">Edit Stats</h3><p className="text-xs text-white/40">{m.displayName}</p></div><button onClick={()=>setStatsDialogId(null)} className="text-white/30 hover:text-white"><X className="w-5 h-5"/></button></div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[{key:"kills",label:"Kills",icon:"💀"},{key:"deaths",label:"Deaths",icon:"☠️"},{key:"kdRatio",label:"K/D Ratio",icon:"🎯"},{key:"totalWins",label:"Wins",icon:"🏆"},{key:"totalLosses",label:"Losses",icon:"📉"},{key:"mvpCount",label:"MVP Count",icon:"⭐"},{key:"clanPoints",label:"Clan Points",icon:"💎"},{key:"activityScore",label:"Activity",icon:"🔥"},{key:"tournamentWins",label:"Tournament Wins",icon:"🥇"},{key:"scrimWins",label:"Scrim Wins",icon:"⚔️"}].map(f=>(
                  <div key={f.key}><label className="text-xs text-white/40 block mb-1">{f.icon} {f.label}</label><Inp value={statsForm[f.key as keyof typeof statsForm]} onChange={v=>setStatsForm(s=>({...s,[f.key]:v}))} type="number"/></div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={async()=>{try{await mf(`/mgmt/stats/${statsDialogId}`,{method:"POST",body:JSON.stringify({kills:Number(statsForm.kills),deaths:Number(statsForm.deaths),kdRatio:parseFloat(statsForm.kdRatio),totalWins:Number(statsForm.totalWins),totalLosses:Number(statsForm.totalLosses),mvpCount:Number(statsForm.mvpCount),clanPoints:Number(statsForm.clanPoints),activityScore:Number(statsForm.activityScore),tournamentWins:Number(statsForm.tournamentWins),scrimWins:Number(statsForm.scrimWins)})},pwd);showToast("Stats updated!");setStatsDialogId(null);loadMembers(pwd);}catch{showToast("Failed");}}}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl">Save Stats</button>
                <button onClick={()=>setStatsDialogId(null)} className="px-4 py-2.5 bg-white/5 text-white/40 font-bold rounded-xl border border-white/8">Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Badges Dialog ── */}
      {badgesDialogId&&(()=>{
        const m=activeMembers.find(x=>x.id===badgesDialogId);if(!m)return null;
        return(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0e0e12] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4"><div><h3 className="font-black text-lg">Edit Badges</h3><p className="text-xs text-white/40">{m.displayName}</p></div><button onClick={()=>setBadgesDialogId(null)} className="text-white/30 hover:text-white"><X className="w-5 h-5"/></button></div>
              <div className="flex flex-wrap gap-1.5 mb-4 min-h-[40px] p-2 bg-white/3 rounded-xl border border-white/8">
                {badgesInput.length===0?<span className="text-xs text-white/25 italic self-center">No badges</span>:badgesInput.map((b,i)=>(
                  <span key={i} className="flex items-center gap-1 text-xs font-bold bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-2 py-1 rounded-lg">
                    {b}<button onClick={()=>setBadgesInput(p=>p.filter((_,j)=>j!==i))} className="text-yellow-400/50 hover:text-red-400"><X className="w-3 h-3"/></button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {PRESET_BADGES.map(b=>(
                  <button key={b} onClick={()=>!badgesInput.includes(b)&&setBadgesInput(p=>[...p,b])}
                    className={`text-xs px-2 py-1 rounded-lg border font-bold transition-colors ${badgesInput.includes(b)?"bg-yellow-400/20 border-yellow-400/40 text-yellow-400":"bg-white/4 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"}`}>{b}</button>
                ))}
              </div>
              <div className="flex gap-2 mb-4">
                <Inp value={customBadge} onChange={setCustomBadge} placeholder="Custom badge..."/>
                <button onClick={()=>{if(customBadge.trim()){setBadgesInput(p=>[...p,customBadge.trim()]);setCustomBadge("");}}} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="flex gap-2">
                <button onClick={async()=>{try{await mf(`/mgmt/badges/${badgesDialogId}`,{method:"POST",body:JSON.stringify({achievements:badgesInput})},pwd);showToast("Badges saved!");setBadgesDialogId(null);loadMembers(pwd);}catch{showToast("Failed");}}}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl">Save Badges</button>
                <button onClick={()=>setBadgesDialogId(null)} className="px-4 py-2.5 bg-white/5 text-white/40 font-bold rounded-xl border border-white/8">Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Scrim Result Dialog ── */}
      {resultDialogId&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0e0e12] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4"><h3 className="font-black text-lg">Record Result</h3><button onClick={()=>setResultDialogId(null)} className="text-white/30 hover:text-white"><X className="w-5 h-5"/></button></div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {(["win","loss","draw"] as const).map(r=>(
                <button key={r} onClick={()=>setResultChoice(r)}
                  className={`py-3 rounded-xl font-black text-sm border transition-colors ${resultChoice===r?(r==="win"?"bg-green-500/20 border-green-500/40 text-green-400":r==="loss"?"bg-red-500/20 border-red-500/40 text-red-400":"bg-yellow-500/20 border-yellow-500/40 text-yellow-400"):"bg-white/4 border-white/10 text-white/50 hover:bg-white/10"}`}>
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="mb-4 space-y-2">
              <label className="text-xs text-white/40 block">Result Screenshot (optional)</label>
              <div className="flex items-center gap-2">
                <FileUploadBtn pwd={pwd} bucket="scrims" onUrl={url=>setResultImageUrl(url)} label="Upload Screenshot"/>
                {resultImageUrl&&<span className="text-xs text-green-400">✓ Uploaded</span>}
              </div>
              {resultImageUrl&&<img src={resultImageUrl} className="w-full max-h-40 object-cover rounded-xl border border-white/8"/>}
            </div>
            <div className="flex gap-2">
              <button onClick={async()=>{try{await mf(`/mgmt/scrims/${resultDialogId}/result`,{method:"POST",body:JSON.stringify({result:resultChoice,resultImageUrl:resultImageUrl||undefined})},pwd);showToast(`Result: ${resultChoice.toUpperCase()} recorded!`);setResultDialogId(null);loadScrims(pwd);}catch{showToast("Failed");}}}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl">Save Result</button>
              <button onClick={()=>setResultDialogId(null)} className="px-4 py-2.5 bg-white/5 text-white/40 font-bold rounded-xl border border-white/8">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
