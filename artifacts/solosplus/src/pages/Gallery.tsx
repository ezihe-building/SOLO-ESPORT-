import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { Image, Loader2, Trophy, Swords, Calendar, Star, Users } from "lucide-react";

interface MediaItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  uploadedByName: string;
  createdAt: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  scrim: { label: "Scrims", icon: Swords, color: "text-blue-400" },
  tournament: { label: "Tournaments", icon: Trophy, color: "text-yellow-400" },
  event: { label: "Events", icon: Calendar, color: "text-purple-400" },
  achievement: { label: "Achievements", icon: Star, color: "text-orange-400" },
  clan_life: { label: "Clan Life", icon: Users, color: "text-green-400" },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG);

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export default function Gallery() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const res = await fetch("/api/media", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMedia(await res.json());
      setLoading(false);
    })();
  }, []);

  const filtered = filter === "all" ? media : media.filter(m => m.category === filter);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Media Gallery</h1>
          <p className="text-white/40 text-sm mt-0.5">Scrim captures, tournament moments and clan memories</p>
        </div>

        {/* Filter bar */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5">
          <div className="flex gap-2 min-w-max sm:flex-wrap sm:min-w-0">
            <button
              onClick={() => setFilter("all")}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${filter === "all" ? "bg-red-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"}`}
            >
              All ({media.length})
            </button>
            {CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const count = media.filter(m => m.category === cat).length;
              if (count === 0) return null;
              const CatIcon = cfg.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${filter === cat ? "bg-red-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"}`}
                >
                  <CatIcon className="w-3.5 h-3.5" />
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-20 text-white/30 gap-3">
            <Image className="w-12 h-12 opacity-20" />
            <p className="font-semibold">No media yet</p>
            <p className="text-xs">Management will upload photos and clips here.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map(item => (
              <button key={item.id} onClick={() => setLightbox(item)} className="group relative rounded-xl overflow-hidden bg-white/4 border border-white/8 aspect-square hover:border-white/20 transition-all">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={e => { (e.target as HTMLImageElement).src = ""; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                  <p className="text-xs font-bold text-white truncate">{item.title}</p>
                </div>
                <div className="absolute top-2 left-2">
                  {CATEGORY_CONFIG[item.category] && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 ${CATEGORY_CONFIG[item.category].color}`}>
                      {CATEGORY_CONFIG[item.category].label.toUpperCase()}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.imageUrl} alt={lightbox.title} className="w-full rounded-2xl object-contain max-h-[70vh]" />
            <div className="mt-3 text-center">
              <p className="font-bold text-white">{lightbox.title}</p>
              <p className="text-xs text-white/40 mt-0.5">Uploaded by {lightbox.uploadedByName} · {new Date(lightbox.createdAt).toLocaleDateString("en-GB")}</p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
