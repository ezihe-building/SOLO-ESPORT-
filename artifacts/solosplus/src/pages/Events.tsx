import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, Users, Loader2, ExternalLink } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  eventDate: string;
  createdByName: string;
  createdAt: string;
}

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const res = await fetch("/api/events", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setEvents(await res.json());
      setLoading(false);
    })();
  }, []);

  const upcoming = events.filter(e => new Date(e.eventDate) >= new Date());
  const past = events.filter(e => new Date(e.eventDate) < new Date());

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
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Events</h1>
          <p className="text-white/40 text-sm mt-0.5">Clan events, tournaments and competitions</p>
        </div>

        {events.length === 0 && (
          <div className="flex flex-col items-center py-20 text-white/30 gap-3">
            <Calendar className="w-12 h-12 opacity-20" />
            <p className="font-semibold">No events scheduled</p>
            <p className="text-xs">Check back soon for upcoming events!</p>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Upcoming Events</h2>
            {upcoming.map(event => <EventCard key={event.id} event={event} isUpcoming />)}
          </div>
        )}

        {past.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Past Events</h2>
            {past.map(event => <EventCard key={event.id} event={event} isUpcoming={false} />)}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function EventCard({ event, isUpcoming }: { event: EventItem; isUpcoming: boolean }) {
  const date = new Date(event.eventDate);
  const now = new Date();
  const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className={`bg-white/[0.03] border rounded-2xl overflow-hidden transition-colors hover:border-white/15 ${isUpcoming ? "border-red-500/20 hover:border-red-500/30" : "border-white/8"}`}>
      {event.imageUrl && (
        <div>
          <img src={event.imageUrl} alt={event.title} className="w-full h-48 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-black text-white text-lg leading-tight">{event.title}</h3>
          {isUpcoming && daysUntil > 0 && (
            <span className="text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full shrink-0">
              {daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
            </span>
          )}
          {!isUpcoming && <span className="text-xs font-bold text-white/30 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full shrink-0">Ended</span>}
        </div>
        <p className="text-sm text-white/55 leading-relaxed mb-3">{event.description}</p>

        {/* Link button */}
        {event.linkUrl && (
          <div className="mb-3">
            <a href={event.linkUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/35 border border-red-500/30 text-red-400 font-bold text-sm transition-colors">
              <ExternalLink className="w-4 h-4" />
              {event.linkLabel || "More Info"}
            </a>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-red-400/70" />
            {date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400/70" />
            {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-400/70" />
            By {event.createdByName}
          </span>
        </div>
      </div>
    </div>
  );
}
