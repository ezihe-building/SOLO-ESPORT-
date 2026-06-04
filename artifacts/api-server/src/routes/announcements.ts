import { Router, type IRouter } from "express";
import { db, announcementsTable, notificationsTable, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireActive, requireManagement, type AuthRequest } from "../middlewares/auth";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function serialize(a: typeof announcementsTable.$inferSelect) {
  return { ...a, createdAt: a.createdAt.toISOString() };
}

router.get("/announcements", requireAuth, requireActive, async (req, res): Promise<void> => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const rows = await db.select().from(announcementsTable)
    .orderBy(announcementsTable.createdAt)
    .limit(limit);
  res.json(rows.map(serialize));
});

router.post("/announcements", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const { title, content, imageUrl, linkUrl, linkLabel, pinned } = req.body as {
    title?: string; content?: string; imageUrl?: string | null;
    linkUrl?: string | null; linkLabel?: string | null; pinned?: boolean;
  };
  if (!title || !content) {
    res.status(400).json({ error: "title and content are required" });
    return;
  }

  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.userId!));
  const [created] = await db.insert(announcementsTable).values({
    id: randomUUID(),
    title,
    content,
    imageUrl: imageUrl ?? null,
    linkUrl: linkUrl ?? null,
    linkLabel: linkLabel ?? null,
    authorId: req.userId!,
    authorName: member?.displayName ?? "Management",
    pinned: pinned ?? false,
  }).returning();

  const allMembers = await db.select({ id: membersTable.id }).from(membersTable)
    .where(eq(membersTable.status, "active"));
  const notifications = allMembers.map(m => ({
    id: randomUUID(),
    userId: m.id,
    type: "announcement" as const,
    title: `New Announcement: ${created.title}`,
    message: created.content.slice(0, 100),
    read: false,
    link: `/announcements`,
  }));
  if (notifications.length > 0) {
    await db.insert(notificationsTable).values(notifications);
  }

  res.status(201).json(serialize(created));
});

router.get("/announcements/:id", requireAuth, requireActive, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [a] = await db.select().from(announcementsTable).where(eq(announcementsTable.id, raw));
  if (!a) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serialize(a));
});

router.delete("/announcements/:id", requireAuth, requireActive, requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(announcementsTable).where(eq(announcementsTable.id, raw));
  res.sendStatus(204);
});

export default router;
