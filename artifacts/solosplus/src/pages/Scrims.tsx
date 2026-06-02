import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useListScrims, useJoinScrim, useLeaveScrim, useCreateScrim } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Swords, Plus, Calendar, Users, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  ongoing: "bg-green-400/10 text-green-400 border-green-400/30",
  completed: "bg-gray-400/10 text-gray-400 border-gray-400/30",
  cancelled: "bg-red-400/10 text-red-400 border-red-400/30",
};

const RESULT_COLORS: Record<string, string> = {
  win: "text-green-400",
  loss: "text-red-400",
  draw: "text-yellow-400",
};

const FILTER_STATUSES = ["all", "upcoming", "ongoing", "completed"];

export default function Scrims() {
  const { member } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ opponentName: "", scheduledAt: "", gameMode: "Battle Royale", requiredPlayers: "5", notes: "" });

  const { data: scrims, isLoading } = useListScrims(
    statusFilter !== "all" ? { status: statusFilter as any } : undefined
  );
  const joinScrim = useJoinScrim();
  const leaveScrim = useLeaveScrim();
  const createScrim = useCreateScrim();

  const canManage = member?.role === "OWNER" || member?.role === "MANAGEMENT";

  const handleJoin = async (id: string) => {
    try {
      await joinScrim.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["listScrims"] });
      toast({ title: "Joined scrim successfully!" });
    } catch {
      toast({ title: "Error", description: "Failed to join scrim.", variant: "destructive" });
    }
  };

  const handleLeave = async (id: string) => {
    try {
      await leaveScrim.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["listScrims"] });
      toast({ title: "Left scrim." });
    } catch {
      toast({ title: "Error", description: "Failed to leave scrim.", variant: "destructive" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createScrim.mutateAsync({
        data: {
          opponentName: form.opponentName,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          gameMode: form.gameMode,
          requiredPlayers: Number(form.requiredPlayers),
          notes: form.notes || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["listScrims"] });
      toast({ title: "Scrim created!" });
      setCreateOpen(false);
      setForm({ opponentName: "", scheduledAt: "", gameMode: "Battle Royale", requiredPlayers: "5", notes: "" });
    } catch {
      toast({ title: "Error", description: "Failed to create scrim.", variant: "destructive" });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
              <Swords className="w-8 h-8 text-primary" />
              SCRIMS
            </h1>
            <p className="text-muted-foreground">Clan wars, scheduled battles, and match history.</p>
          </div>
          {canManage && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" /> New Scrim
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10">
                <DialogHeader>
                  <DialogTitle>Schedule New Scrim</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Opponent Clan</Label>
                    <Input value={form.opponentName} onChange={e => setForm({ ...form, opponentName: e.target.value })} required className="bg-black/50 border-white/10" placeholder="Rival Clan" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date & Time</Label>
                    <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} required className="bg-black/50 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Game Mode</Label>
                    <Input value={form.gameMode} onChange={e => setForm({ ...form, gameMode: e.target.value })} className="bg-black/50 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Players Required</Label>
                    <Input type="number" value={form.requiredPlayers} onChange={e => setForm({ ...form, requiredPlayers: e.target.value })} className="bg-black/50 border-white/10" min={1} max={20} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-black/50 border-white/10" placeholder="Special instructions..." />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={createScrim.isPending}>
                    {createScrim.isPending ? "Creating..." : "Schedule Scrim"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {FILTER_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                statusFilter === s ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Loading scrims...</div>
        ) : !scrims?.length ? (
          <div className="text-center py-12 text-muted-foreground">No scrims found.</div>
        ) : (
          <div className="grid gap-4">
            {scrims.map(scrim => (
              <Card key={scrim.id} className="glass-card border-white/10 hover:border-primary/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">SOLOS+ vs {scrim.opponentName}</h3>
                        <Badge className={`border text-xs ${STATUS_COLORS[scrim.status]}`}>
                          {scrim.status}
                        </Badge>
                        {scrim.result && (
                          <span className={`font-bold text-sm ${RESULT_COLORS[scrim.result]}`}>
                            {scrim.result.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(scrim.scheduledAt).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Swords className="w-4 h-4" />
                          {scrim.gameMode}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {scrim.signupCount ?? 0}/{scrim.requiredPlayers} signed up
                        </span>
                      </div>

                      {scrim.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">{scrim.notes}</p>
                      )}
                    </div>

                    {scrim.status === "upcoming" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30"
                          onClick={() => handleJoin(scrim.id)}
                          disabled={joinScrim.isPending}
                        >
                          Join
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-muted-foreground hover:text-foreground"
                          onClick={() => handleLeave(scrim.id)}
                          disabled={leaveScrim.isPending}
                        >
                          Leave
                        </Button>
                      </div>
                    )}
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
