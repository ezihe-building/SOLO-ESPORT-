import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useListAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Pin, Trash2 } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  general: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  scrim: "bg-green-400/10 text-green-400 border-green-400/30",
  tournament: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
  promotion: "bg-purple-400/10 text-purple-400 border-purple-400/30",
  meeting: "bg-orange-400/10 text-orange-400 border-orange-400/30",
  urgent: "bg-red-400/10 text-red-400 border-red-400/30",
};

const TYPES = ["general", "scrim", "tournament", "promotion", "meeting", "urgent"];

export default function Announcements() {
  const { member } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "general", pinned: false });

  const { data: announcements, isLoading } = useListAnnouncements({ limit: 50 });
  const create = useCreateAnnouncement();
  const remove = useDeleteAnnouncement();

  const canManage = member?.role === "OWNER" || member?.role === "MANAGEMENT";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({ data: { ...form, type: form.type as any } });
      queryClient.invalidateQueries({ queryKey: ["listAnnouncements"] });
      toast({ title: "Announcement posted!" });
      setCreateOpen(false);
      setForm({ title: "", content: "", type: "general", pinned: false });
    } catch {
      toast({ title: "Error", description: "Failed to post announcement.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["listAnnouncements"] });
      toast({ title: "Announcement deleted." });
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const sorted = [...(announcements ?? [])].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-primary" />
              ANNOUNCEMENTS
            </h1>
            <p className="text-muted-foreground">Official clan communications and updates.</p>
          </div>
          {canManage && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" /> Post
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10">
                <DialogHeader>
                  <DialogTitle>Post Announcement</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="bg-black/50 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <textarea
                      value={form.content}
                      onChange={e => setForm({ ...form, content: e.target.value })}
                      required
                      className="w-full h-32 bg-black/50 border border-white/10 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <div className="flex flex-wrap gap-2">
                      {TYPES.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, type: t })}
                          className={`px-3 py-1 rounded text-xs font-medium border transition-colors capitalize ${
                            form.type === t ? TYPE_COLORS[t] : "bg-white/5 border-white/10 text-muted-foreground"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} className="rounded" />
                    <span className="text-sm">Pin announcement</span>
                  </label>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={create.isPending}>
                    {create.isPending ? "Posting..." : "Post Announcement"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Loading...</div>
        ) : !sorted.length ? (
          <div className="text-center py-12 text-muted-foreground">No announcements yet.</div>
        ) : (
          <div className="space-y-4">
            {sorted.map(ann => (
              <Card key={ann.id} className={`glass-card border-white/10 ${ann.pinned ? "border-primary/30" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {ann.pinned && <Pin className="w-4 h-4 text-primary shrink-0" />}
                        <h3 className="font-bold text-lg">{ann.title}</h3>
                        <Badge className={`border text-xs ${TYPE_COLORS[ann.type] ?? ""}`}>
                          {ann.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm">{ann.content}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>By {ann.authorName}</span>
                        <span>•</span>
                        <span>{new Date(ann.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
