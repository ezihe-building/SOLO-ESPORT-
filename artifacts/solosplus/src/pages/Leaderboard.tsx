import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Crown, Medal, Swords, Activity, Target } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  OWNER: "text-yellow-400",
  MANAGEMENT: "text-purple-400",
  TIER1: "text-red-400",
  TIER2: "text-orange-400",
  TIER3: "text-blue-400",
  NEW_MEMBER: "text-gray-400",
};

const SORT_OPTIONS = [
  { value: "clanPoints", label: "Clan Points", icon: Trophy },
  { value: "kdRatio", label: "K/D Ratio", icon: Target },
  { value: "mvpCount", label: "MVPs", icon: Crown },
  { value: "activityScore", label: "Activity", icon: Activity },
  { value: "scrimWins", label: "Scrim Wins", icon: Swords },
];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-muted-foreground text-sm w-5 text-center">#{rank}</span>;
}

export default function Leaderboard() {
  const [sortBy, setSortBy] = useState("clanPoints");
  const { data: entries, isLoading } = useGetLeaderboard({ sortBy: sortBy as any, limit: 50 });

  const activeSortOption = SORT_OPTIONS.find(o => o.value === sortBy);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            LEADERBOARD
          </h1>
          <p className="text-muted-foreground">Ranking the elite — who stands above the rest.</p>
        </div>

        {/* Sort tabs */}
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === opt.value
                  ? "bg-primary text-white"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              <opt.icon className="w-4 h-4" />
              {opt.label}
            </button>
          ))}
        </div>

        <Card className="glass-card border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">
              Ranked by {activeSortOption?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading rankings...</div>
            ) : !entries?.length ? (
              <div className="p-8 text-center text-muted-foreground">No members ranked yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {entries.map((entry) => (
                  <div
                    key={entry.memberId}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/5 ${
                      entry.rank <= 3 ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="w-8 flex justify-center">
                      <RankIcon rank={entry.rank} />
                    </div>

                    <Avatar className="w-10 h-10 border border-white/10">
                      <AvatarImage src={entry.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {entry.displayName.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{entry.displayName}</div>
                      <div className={`text-xs ${ROLE_COLORS[entry.role] ?? "text-muted-foreground"}`}>
                        {entry.role}
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-primary">{entry.clanPoints.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{entry.kdRatio.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">K/D</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{entry.mvpCount}</div>
                        <div className="text-xs text-muted-foreground">MVPs</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{entry.scrimWins}</div>
                        <div className="text-xs text-muted-foreground">Wins</div>
                      </div>
                    </div>

                    {/* Mobile: show sorted stat */}
                    <div className="md:hidden text-right">
                      <div className="font-bold text-primary">
                        {sortBy === "clanPoints" && entry.clanPoints.toLocaleString()}
                        {sortBy === "kdRatio" && entry.kdRatio.toFixed(2)}
                        {sortBy === "mvpCount" && entry.mvpCount}
                        {sortBy === "activityScore" && entry.activityScore}
                        {sortBy === "scrimWins" && entry.scrimWins}
                      </div>
                      <div className="text-xs text-muted-foreground">{activeSortOption?.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
