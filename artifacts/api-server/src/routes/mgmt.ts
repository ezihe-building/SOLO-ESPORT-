import { Router, type IRouter, type Request, type Response } from "express";
import {
  db, membersTable, notificationsTable,
  eventsTable, feedPostsTable, mediaGalleryTable,
  announcementsTable, scrimsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const MGMT_PASSWORD = "terrorist";
const router: IRouter = Router();

function checkPassword(req: Request, res: Response): boolean {
  const pwd = req.headers["x-mgmt-password"] as string | undefined;
  if (pwd !== MGMT_PASSWORD) {
    res.status(401).json({ error: "Invalid management password" });
    return false;
  }
  return true;
}

function serializeMember(m: typeof membersTable.$inferSelect) {
  return {
    id: m.id,
    email: m.email,
    codmUsername: m.codmUsername,
    displayName: m.displayName,
    whatsappNumber: m.whatsappNumber ?? null,
    tiktokUsername: (m as any).tiktokUsername ?? null,
    instagramUsername: (m as any).instagramUsername ?? null,
    discordUsername: (m as any).discordUsername ?? null,
    customTag: m.customTag ?? null,
    role: m.role,
    status: m.status,
    avatarUrl: m.avatarUrl ?? null,
    bio: m.bio ?? null,
    clanPoints: m.clanPoints,
    kills: (m as any).kills ?? 0,
    deaths: (m as any).deaths ?? 0,
    kdRatio: m.kdRatio,
    totalWins: (m as any).totalWins ?? 0,
    totalLosses: (m as any).totalLosses ?? 0,
    mvpCount: m.mvpCount,
    activityScore: m.activityScore,
    tournamentWins: (m as any).tournamentWins ?? 0,
    scrimWins: m.scrimWins,
    isOnline: m.isOnline,
    lastSeen: m.lastSeen?.toISOString() ?? null,
    achievements: m.achievements,
    createdAt: m.createdAt.toISOString(),
  };
}

// ── Members ─────────────────────────────────────────────────────────────────

router.get("/mgmt/pending", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const rows = await db.select().from(membersTable).where(eq(membersTable.status, "pending"));
  res.json(rows.map(serializeMember));
});

router.get("/mgmt/members", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const rows = await db.select().from(membersTable).where(eq(membersTable.status, "active"));
  res.json(rows.map(serializeMember));
});

router.get("/mgmt/all-members", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const rows = await db.select().from(membersTable);
  res.json(rows.map(serializeMember));
});

router.post("/mgmt/approve/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [updated] = await db.update(membersTable).set({ status: "active" }).where(eq(membersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  await db.insert(notificationsTable).values({
    id: randomUUID(), userId: id, type: "approval",
    title: "Application Approved!",
    message: "Welcome to SOLOS+ ESPORTZ! Your application has been approved.",
    read: false, link: "/welcome",
  });
  res.json(serializeMember(updated));
});

router.post("/mgmt/reject/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [updated] = await db.update(membersTable).set({ status: "rejected" }).where(eq(membersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(serializeMember(updated));
});

router.post("/mgmt/suspend/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { reason } = req.body as { reason?: string };
  const [updated] = await db.update(membersTable).set({ status: "suspended" as any }).where(eq(membersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  await db.insert(notificationsTable).values({
    id: randomUUID(), userId: id, type: "system",
    title: "Account Suspended",
    message: reason ? `Your account has been suspended. Reason: ${reason}` : "Your account has been temporarily suspended.",
    read: false, link: "/rejected",
  });
  res.json(serializeMember(updated));
});

router.post("/mgmt/restore/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [updated] = await db.update(membersTable).set({ status: "active" }).where(eq(membersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  await db.insert(notificationsTable).values({
    id: randomUUID(), userId: id, type: "system",
    title: "Account Restored",
    message: "Your account has been restored. Welcome back to SOLOS+ ESPORTZ!",
    read: false, link: "/dashboard",
  });
  res.json(serializeMember(updated));
});

router.post("/mgmt/kick/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.update(membersTable).set({ status: "kicked" }).where(eq(membersTable.id, id));
  res.sendStatus(204);
});

router.delete("/mgmt/delete/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(membersTable).where(eq(membersTable.id, id));
  res.sendStatus(204);
});

router.post("/mgmt/role/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { role, customTag } = req.body as { role: string; customTag?: string | null };
  if (!role) { res.status(400).json({ error: "role required" }); return; }
  const update: Record<string, unknown> = { role };
  if (customTag !== undefined) update.customTag = customTag ?? null;
  const [updated] = await db.update(membersTable).set(update as any).where(eq(membersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  await db.insert(notificationsTable).values({
    id: randomUUID(), userId: id, type: "promotion",
    title: "Your role has been updated",
    message: `You have been assigned the role: ${role}${customTag ? ` (${customTag})` : ""}`,
    read: false, link: "/profile",
  });
  res.json(serializeMember(updated));
});

router.post("/mgmt/tag/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { customTag } = req.body as { customTag: string | null };
  const [updated] = await db.update(membersTable).set({ customTag: customTag ?? null }).where(eq(membersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(serializeMember(updated));
});

router.post("/mgmt/stats/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = req.body as Record<string, number>;
  const updateData: Record<string, unknown> = {};
  const numFields = ["kills","deaths","kdRatio","totalWins","totalLosses","mvpCount","clanPoints","activityScore","tournamentWins","scrimWins"];
  for (const f of numFields) {
    if (body[f] !== undefined) updateData[f] = f === "kdRatio" ? parseFloat(String(body[f])) : Number(body[f]);
  }
  const [updated] = await db.update(membersTable).set(updateData as any).where(eq(membersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(serializeMember(updated));
});

router.post("/mgmt/badges/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { achievements } = req.body as { achievements: string[] };
  const [updated] = await db.update(membersTable).set({ achievements: achievements ?? [] }).where(eq(membersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(serializeMember(updated));
});

// ── Stats overview ──────────────────────────────────────────────────────────

router.get("/mgmt/stats", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const all = await db.select().from(membersTable);
  res.json({
    total: all.length,
    pending: all.filter(m => m.status === "pending").length,
    active: all.filter(m => m.status === "active").length,
    rejected: all.filter(m => m.status === "rejected").length,
    kicked: all.filter(m => m.status === "kicked").length,
    suspended: all.filter(m => (m.status as string) === "suspended").length,
    byRole: {
      OWNER: all.filter(m => m.role === "OWNER" && m.status === "active").length,
      MANAGEMENT: all.filter(m => m.role === "MANAGEMENT" && m.status === "active").length,
      TIER1: all.filter(m => m.role === "TIER1" && m.status === "active").length,
      TIER2: all.filter(m => m.role === "TIER2" && m.status === "active").length,
      TIER3: all.filter(m => m.role === "TIER3" && m.status === "active").length,
      NEW_MEMBER: all.filter(m => m.role === "NEW_MEMBER" && m.status === "active").length,
    },
  });
});

// ── Announcements ───────────────────────────────────────────────────────────

router.get("/mgmt/announcements", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const rows = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt));
  res.json(rows.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

router.post("/mgmt/announcements", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const { title, content, type, pinned, imageUrl, linkUrl, linkLabel } = req.body as {
    title: string; content: string; type: string; pinned?: boolean;
    imageUrl?: string; linkUrl?: string; linkLabel?: string;
  };
  if (!title || !content) { res.status(400).json({ error: "title and content required" }); return; }
  const [created] = await db.insert(announcementsTable).values({
    id: randomUUID(), title, content,
    type: (type ?? "general") as any,
    pinned: pinned ?? false,
    authorId: "owner", authorName: "Owner",
    imageUrl: imageUrl ?? null,
    linkUrl: linkUrl ?? null,
    linkLabel: linkLabel ?? null,
  }).returning();
  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
});

router.patch("/mgmt/announcements/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { title, content, type, pinned, imageUrl, linkUrl, linkLabel } = req.body as {
    title?: string; content?: string; type?: string; pinned?: boolean;
    imageUrl?: string | null; linkUrl?: string | null; linkLabel?: string | null;
  };
  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (type !== undefined) updateData.type = type;
  if (pinned !== undefined) updateData.pinned = pinned;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
  if (linkLabel !== undefined) updateData.linkLabel = linkLabel;
  const [updated] = await db.update(announcementsTable).set(updateData as any).where(eq(announcementsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/mgmt/announcements/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  res.sendStatus(204);
});

// ── Events ──────────────────────────────────────────────────────────────────

router.get("/mgmt/events", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const rows = await db.select().from(eventsTable).orderBy(desc(eventsTable.eventDate));
  res.json(rows.map(e => ({ ...e, eventDate: e.eventDate.toISOString(), createdAt: e.createdAt.toISOString() })));
});

router.post("/mgmt/events", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const { title, description, imageUrl, linkUrl, linkLabel, eventDate } = req.body as {
    title: string; description: string; imageUrl?: string; linkUrl?: string; linkLabel?: string; eventDate: string;
  };
  if (!title || !description || !eventDate) { res.status(400).json({ error: "title, description and eventDate required" }); return; }
  const [created] = await db.insert(eventsTable).values({
    id: randomUUID(), title, description,
    imageUrl: imageUrl ?? null,
    linkUrl: linkUrl ?? null,
    linkLabel: linkLabel ?? null,
    eventDate: new Date(eventDate),
    createdBy: "owner", createdByName: "Owner",
  }).returning();
  res.status(201).json({ ...created, eventDate: created.eventDate.toISOString(), createdAt: created.createdAt.toISOString() });
});

router.patch("/mgmt/events/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { title, description, imageUrl, linkUrl, linkLabel, eventDate } = req.body as {
    title?: string; description?: string; imageUrl?: string | null; linkUrl?: string | null; linkLabel?: string | null; eventDate?: string;
  };
  const updateData: Record<string, unknown> = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
  if (linkLabel !== undefined) updateData.linkLabel = linkLabel;
  if (eventDate) updateData.eventDate = new Date(eventDate);
  const [updated] = await db.update(eventsTable).set(updateData as any).where(eq(eventsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, eventDate: updated.eventDate.toISOString(), createdAt: updated.createdAt.toISOString() });
});

router.delete("/mgmt/events/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.sendStatus(204);
});

// ── Feed ────────────────────────────────────────────────────────────────────

router.get("/mgmt/feed", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const rows = await db.select().from(feedPostsTable).orderBy(desc(feedPostsTable.createdAt));
  res.json(rows.map(f => ({ ...f, createdAt: f.createdAt.toISOString() })));
});

router.post("/mgmt/feed", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const { content, imageUrl, postType } = req.body as { content: string; imageUrl?: string; postType?: string };
  if (!content) { res.status(400).json({ error: "content required" }); return; }
  const [created] = await db.insert(feedPostsTable).values({
    id: randomUUID(),
    authorId: "owner",
    authorName: "Owner",
    authorRole: "OWNER",
    content,
    imageUrl: imageUrl ?? null,
    postType: (postType ?? "news") as any,
    likeCount: 0,
  }).returning();
  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
});

router.delete("/mgmt/feed/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(feedPostsTable).where(eq(feedPostsTable.id, id));
  res.sendStatus(204);
});

// ── Media Gallery ───────────────────────────────────────────────────────────

router.get("/mgmt/media", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const rows = await db.select().from(mediaGalleryTable).orderBy(desc(mediaGalleryTable.createdAt));
  res.json(rows.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

router.post("/mgmt/media", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const { title, imageUrl, category } = req.body as { title: string; imageUrl: string; category?: string };
  if (!title || !imageUrl) { res.status(400).json({ error: "title and imageUrl required" }); return; }
  const [created] = await db.insert(mediaGalleryTable).values({
    id: randomUUID(), title, imageUrl,
    category: (category ?? "clan_life") as any,
    uploadedBy: "owner", uploadedByName: "Owner",
  }).returning();
  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
});

router.delete("/mgmt/media/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(mediaGalleryTable).where(eq(mediaGalleryTable.id, id));
  res.sendStatus(204);
});

// ── Scrims ──────────────────────────────────────────────────────────────────

router.get("/mgmt/scrims", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const rows = await db.select().from(scrimsTable).orderBy(desc(scrimsTable.scheduledAt));
  res.json(rows.map(s => ({ ...s, scheduledAt: s.scheduledAt.toISOString(), createdAt: s.createdAt.toISOString() })));
});

router.post("/mgmt/scrims", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const { opponentName, scheduledAt, gameMode, requiredPlayers, notes, imageUrl, linkUrl, linkLabel } = req.body as {
    opponentName: string; scheduledAt: string; gameMode: string; requiredPlayers?: number;
    notes?: string; imageUrl?: string; linkUrl?: string; linkLabel?: string;
  };
  if (!opponentName || !scheduledAt) { res.status(400).json({ error: "opponentName and scheduledAt required" }); return; }
  const [created] = await db.insert(scrimsTable).values({
    id: randomUUID(),
    opponentName,
    scheduledAt: new Date(scheduledAt),
    gameMode: gameMode ?? "Battle Royale",
    requiredPlayers: requiredPlayers ?? 5,
    notes: notes ?? null,
    imageUrl: imageUrl ?? null,
    linkUrl: linkUrl ?? null,
    linkLabel: linkLabel ?? null,
    status: "upcoming",
    createdBy: "owner",
  }).returning();
  res.status(201).json({ ...created, scheduledAt: created.scheduledAt.toISOString(), createdAt: created.createdAt.toISOString() });
});

router.patch("/mgmt/scrims/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { opponentName, scheduledAt, gameMode, requiredPlayers, notes, imageUrl, linkUrl, linkLabel, status } = req.body as {
    opponentName?: string; scheduledAt?: string; gameMode?: string; requiredPlayers?: number;
    notes?: string | null; imageUrl?: string | null; linkUrl?: string | null; linkLabel?: string | null; status?: string;
  };
  const updateData: Record<string, unknown> = {};
  if (opponentName) updateData.opponentName = opponentName;
  if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
  if (gameMode) updateData.gameMode = gameMode;
  if (requiredPlayers !== undefined) updateData.requiredPlayers = requiredPlayers;
  if (notes !== undefined) updateData.notes = notes;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
  if (linkLabel !== undefined) updateData.linkLabel = linkLabel;
  if (status) updateData.status = status;
  const [updated] = await db.update(scrimsTable).set(updateData as any).where(eq(scrimsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, scheduledAt: updated.scheduledAt.toISOString(), createdAt: updated.createdAt.toISOString() });
});

router.post("/mgmt/scrims/:id/result", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { result, resultImageUrl } = req.body as { result: "win" | "loss" | "draw"; resultImageUrl?: string };
  const updateData: Record<string, unknown> = { result, status: "completed" };
  if (resultImageUrl) updateData.resultImageUrl = resultImageUrl;
  const [updated] = await db.update(scrimsTable).set(updateData as any).where(eq(scrimsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, scheduledAt: updated.scheduledAt.toISOString(), createdAt: updated.createdAt.toISOString() });
});

router.delete("/mgmt/scrims/:id", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(scrimsTable).where(eq(scrimsTable.id, id));
  res.sendStatus(204);
});

// ── Broadcast ───────────────────────────────────────────────────────────────

router.post("/mgmt/broadcast", async (req, res): Promise<void> => {
  if (!checkPassword(req, res)) return;
  const { title, message, targetRole } = req.body as { title: string; message: string; targetRole?: string };
  if (!title || !message) { res.status(400).json({ error: "title and message required" }); return; }
  let members = await db.select().from(membersTable).where(eq(membersTable.status, "active"));
  if (targetRole && targetRole !== "ALL") members = members.filter(m => m.role === targetRole);
  await Promise.all(members.map(m =>
    db.insert(notificationsTable).values({
      id: randomUUID(), userId: m.id, type: "system",
      title, message, read: false, link: "/dashboard",
    })
  ));
  res.json({ sent: members.length });
});

export default router;
