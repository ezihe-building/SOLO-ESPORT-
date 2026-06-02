import React, { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useListChatGroups, useGetChatMessages, useSendMessage } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";

const GROUP_COLORS: Record<string, string> = {
  TIER1: "text-red-400",
  TIER2: "text-orange-400",
  TIER3: "text-blue-400",
  NEW_MEMBER: "text-gray-400",
  MANAGEMENT: "text-purple-400",
  GENERAL: "text-green-400",
};

export default function Groups() {
  const { member } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: groups, isLoading: groupsLoading } = useListChatGroups();
  const { data: messages, isLoading: messagesLoading } = useGetChatMessages(
    selectedGroupId ?? "__none__",
    { query: { queryKey: ["getChatMessages", selectedGroupId], enabled: !!selectedGroupId } }
  );
  const sendMsg = useSendMessage();

  useEffect(() => {
    if (groups?.length && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-refresh messages every 5s
  useEffect(() => {
    if (!selectedGroupId) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["getChatMessages", selectedGroupId] });
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedGroupId, queryClient]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedGroupId) return;
    try {
      await sendMsg.mutateAsync({ groupId: selectedGroupId, data: { content: message.trim() } });
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["getChatMessages", selectedGroupId] });
    } catch {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    }
  };

  const selectedGroup = groups?.find(g => g.id === selectedGroupId);

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Group list */}
        <div className="w-64 shrink-0 flex flex-col gap-1">
          <div className="mb-3">
            <h2 className="font-black text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              GROUPS
            </h2>
            <p className="text-xs text-muted-foreground">Tier-based channels</p>
          </div>
          {groupsLoading ? (
            <div className="text-muted-foreground text-sm animate-pulse">Loading groups...</div>
          ) : groups?.map(group => (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                selectedGroupId === group.id
                  ? "bg-primary/20 border border-primary/30"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className={`font-semibold text-sm ${GROUP_COLORS[group.type] ?? ""}`}>
                # {group.name}
              </div>
              {group.lastMessage && (
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {group.lastMessage}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col glass-card rounded-xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 shrink-0">
            {selectedGroup ? (
              <div>
                <span className={`font-bold ${GROUP_COLORS[selectedGroup.type] ?? ""}`}>
                  # {selectedGroup.name}
                </span>
                <span className="text-xs text-muted-foreground ml-2">{selectedGroup.type} channel</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">Select a group</span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedGroupId ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a group to start chatting
              </div>
            ) : messagesLoading ? (
              <div className="text-center text-muted-foreground animate-pulse">Loading messages...</div>
            ) : !messages?.length ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No messages yet. Be the first to say something!
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.authorId === member?.id;
                return (
                  <div key={msg.id} className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                    <Avatar className="w-8 h-8 shrink-0 border border-white/10">
                      <AvatarImage src={msg.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {msg.authorName.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      {!isMe && (
                        <span className="text-xs text-muted-foreground">{msg.authorName}</span>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        isMe
                          ? "bg-primary text-white rounded-tr-sm"
                          : "bg-white/10 rounded-tl-sm"
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2 shrink-0">
            <Input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={selectedGroup ? `Message #${selectedGroup.name}...` : "Select a group first"}
              disabled={!selectedGroupId}
              className="bg-black/50 border-white/10 flex-1"
            />
            <Button type="submit" disabled={!message.trim() || sendMsg.isPending} className="bg-primary hover:bg-primary/90 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
