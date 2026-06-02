import { Router, type IRouter } from "express";
import { db, notificationsTable, membersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireActive, requireManagement, type AuthRequest } from "../middlewares/auth";
import {
  ListNotificationsResponse,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function serialize(n: typeof notificationsTable.$inferSelect) {
  return { ...n, link: n.link ?? null, createdAt: n.createdAt.toISOString() };
}

router.get("/notifications", requireAuth, requireActive, async (req: AuthRequest, res): Promise<void> => {
  const unreadOnly = req.query.unreadOnly === "true";
  let rows = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, req.userId!));
  if (unreadOnly) rows = rows.filter(n => !n.read);
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  res.json(ListNotificationsResponse.parse(rows.map(serialize)));
});

router.post("/notifications/:id/read", requireAuth, requireActive, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [updated] = await db.update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, raw), eq(notificationsTable.userId, req.userId!)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(MarkNotificationReadResponse.parse(serialize(updated)));
});

router.post("/notifications/read-all", requireAuth, requireActive, async (req: AuthRequest, res): Promise<void> => {
  await db.update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, req.userId!));
  res.sendStatus(204);
});

router.post("/notifications/broadcast", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const { title, message, targetRole } = req.body as { title: string; message: string; targetRole?: string | null };
  if (!title || !message) { res.status(400).json({ error: "title and message are required" }); return; }

  let members = await db.select({ id: membersTable.id }).from(membersTable)
    .where(eq(membersTable.status, "active"));
  if (targetRole) members = members.filter(() => true);

  if (targetRole) {
    const allActive = await db.select({ id: membersTable.id, role: membersTable.role })
      .from(membersTable).where(eq(membersTable.status, "active"));
    const filtered = allActive.filter(m => m.role === targetRole);
    const notifications = filtered.map(m => ({
      id: randomUUID(),
      userId: m.id,
      type: "system" as const,
      title,
      message,
      read: false,
      link: null,
    }));
    if (notifications.length > 0) await db.insert(notificationsTable).values(notifications);
    res.json({ sent: notifications.length });
    return;
  }

  const allActive = await db.select({ id: membersTable.id }).from(membersTable)
    .where(eq(membersTable.status, "active"));
  const notifications = allActive.map(m => ({
    id: randomUUID(),
    userId: m.id,
    type: "system" as const,
    title,
    message,
    read: false,
    link: null,
  }));
  if (notifications.length > 0) await db.insert(notificationsTable).values(notifications);
  res.json({ sent: notifications.length });
});

export default router;
