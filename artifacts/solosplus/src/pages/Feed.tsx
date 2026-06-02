import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Heart, Loader2, Trophy, Swords, Star, Camera, Megaphone, Flame, Crown } from "lucide-react";

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  imageUrl: string | null;
  postType: string;
  likeCount: number;
  likedBy: string[];
  createdAt: string;
}

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

const POST_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  news: { icon: Megaphone, label: "News", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  tournament: { icon: Trophy, label: "Tournament", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  achievement: { icon: Star, label: "Achievement", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  screenshot: { icon: Camera, label: "Screenshot", color: "text-green-400 bg-green-400/10 border-green-400/20" },
  promotion: { icon: Crown, label: "Promotion", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  highlight: { icon: Flame, label: "Highlight", color: "text-red-400 bg-red-400/10 border-red-400/20" },
  scrim_result: { icon: Swords, label: "Scrim Result", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "text-yellow-400",
  MANAGEMENT: "text-purple-400",
  TIER1: "text-red-400",
  TIER2: "text-orange-400",
  TIER3: "text-blue-400",
  NEW_MEMBER: "text-gray-400",
};

export default function Feed() {
  const { member } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    const token = await getToken();
    const res = await fetch("/api/feed", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }

  async function handleLike(postId: string) {
    if (liking.has(postId)) return;
    setLiking(l => new Set(l).add(postId));
    const token = await getToken();
    const res = await fetch(`/api/feed/${postId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (res.ok) {
      const updated = await res.json();
      setPosts(ps => ps.map(p => p.id === postId ? updated : p));
    }
    setLiking(l => { const s = new Set(l); s.delete(postId); return s; });
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Clan Feed</h1>
          <p className="text-white/40 text-sm mt-0.5">Latest news and highlights from SOLOS+</p>
        </div>

        {posts.length === 0 && (
          <div className="flex flex-col items-center py-20 text-white/30 gap-3">
            <Flame className="w-12 h-12 opacity-20" />
            <p className="font-semibold">No posts yet</p>
            <p className="text-xs">Management will post updates here soon.</p>
          </div>
        )}

        {posts.map(post => {
          const typeConfig = POST_TYPE_CONFIG[post.postType] ?? POST_TYPE_CONFIG.news;
          const TypeIcon = typeConfig.icon;
          const userLiked = member ? post.likedBy.includes(member.id) : false;
          const initials = post.authorName.replace(/^S²十/, "").slice(0, 2).toUpperCase();

          return (
            <div key={post.id} className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden hover:border-white/14 transition-colors">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 pb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center text-red-400 font-black text-sm shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white truncate">{post.authorName}</span>
                    <span className={`text-[10px] font-bold ${ROLE_COLORS[post.authorRole] ?? "text-gray-400"}`}>
                      {post.authorRole}
                    </span>
                  </div>
                  <span className="text-xs text-white/35">
                    {new Date(post.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeConfig.color}`}>
                  <TypeIcon className="w-3 h-3" />
                  {typeConfig.label}
                </span>
              </div>

              {/* Image */}
              {post.imageUrl && (
                <div className="px-4 pb-3">
                  <img src={post.imageUrl} alt="Post" className="w-full rounded-xl object-cover max-h-72" onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
                </div>
              )}

              {/* Content */}
              <div className="px-4 pb-3">
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Footer */}
              <div className="border-t border-white/6 px-4 py-2.5 flex items-center gap-4">
                <button
                  onClick={() => handleLike(post.id)}
                  disabled={liking.has(post.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors font-semibold ${userLiked ? "text-red-400" : "text-white/35 hover:text-red-400"}`}
                >
                  <Heart className={`w-4 h-4 ${userLiked ? "fill-red-400" : ""}`} />
                  <span>{post.likeCount}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}
