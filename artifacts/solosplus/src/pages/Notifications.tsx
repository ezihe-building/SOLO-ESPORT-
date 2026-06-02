import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Trophy, Swords, Megaphone, Star, Users, Settings } from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  approval: <Users className="w-5 h-5 text-green-400" />,
  promotion: <Star className="w-5 h-5 text-yellow-400" />,
  demotion: <Users className="w-5 h-5 text-red-400" />,
  announcement: <Megaphone className="w-5 h-5 text-blue-400" />,
  scrim: <Swords className="w-5 h-5 text-orange-400" />,
  tournament: <Trophy className="w-5 h-5 text-primary" />,
  leaderboard: <Trophy className="w-5 h-5 text-yellow-400" />,
  system: <Settings className="w-5 h-5 text-muted-foreground" />,
};

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications({});
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["listNotifications"] });

  const handleMarkOne = async (id: string) => {
    try {
      await markRead.mutateAsync({ id });
      invalidate();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      invalidate();
      toast({ title: "All notifications marked as read." });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              NOTIFICATIONS
              {unreadCount > 0 && (
                <span className="bg-primary text-white text-sm rounded-full px-2.5 py-0.5 font-bold">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground">Stay updated on clan activity.</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAll} className="border-white/10 text-muted-foreground hover:text-foreground">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Loading...</div>
        ) : !notifications?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
            <Bell className="w-16 h-16 opacity-20" />
            <p>No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <Card
                key={n.id}
                className={`glass-card border-white/10 cursor-pointer transition-colors hover:border-primary/20 ${
                  !n.read ? "border-primary/20 bg-primary/5" : ""
                }`}
                onClick={() => !n.read && handleMarkOne(n.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-0.5">
                      {TYPE_ICONS[n.type] ?? <Bell className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{n.title}</span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
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
