import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useListMembers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, Wifi } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
  MANAGEMENT: "bg-purple-400/10 text-purple-400 border-purple-400/30",
  TIER1: "bg-red-400/10 text-red-400 border-red-400/30",
  TIER2: "bg-orange-400/10 text-orange-400 border-orange-400/30",
  TIER3: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  NEW_MEMBER: "bg-gray-400/10 text-gray-400 border-gray-400/30",
};

const FILTERS = ["ALL", "TIER1", "TIER2", "TIER3", "NEW_MEMBER", "MANAGEMENT", "OWNER"];

export default function Members() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const { data: members, isLoading } = useListMembers({ status: "active" });

  const filtered = (members ?? []).filter(m => {
    const matchesSearch = m.displayName.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            ROSTER
          </h1>
          <p className="text-muted-foreground">The SOLOS+ ESPORTZ active members.</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setRoleFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  roleFilter === f
                    ? "bg-primary text-white"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Loading roster...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No members found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(member => (
              <Card key={member.id} className="glass-card border-white/10 hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="w-14 h-14 border-2 border-white/10">
                        <AvatarImage src={member.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {member.displayName.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {member.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{member.displayName}</div>
                      <Badge className={`text-xs border ${ROLE_COLORS[member.role] ?? ""} mt-1`}>
                        {member.role}
                      </Badge>
                      {member.bio && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{member.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                    <div className="text-center">
                      <div className="text-sm font-bold text-primary">{member.clanPoints.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold">{member.kdRatio.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">K/D</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold">{member.mvpCount}</div>
                      <div className="text-xs text-muted-foreground">MVPs</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
