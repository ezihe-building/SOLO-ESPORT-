import { Router, type IRouter } from "express";
import { db, scrimsTable, scrimSignupsTable, membersTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireActive, requireManagement, type AuthRequest } from "../middlewares/auth";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function serializeScrim(s: typeof scrimsTable.$inferSelect, signupCount = 0) {
  return {
    ...s,
    scheduledAt: s.scheduledAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    result: s.result ?? null,
    signupCount,
  };
}

function serializeSignup(s: typeof scrimSignupsTable.$inferSelect) {
  return { ...s, createdAt: s.createdAt.toISOString() };
}

router.get("/scrims", requireAuth, requireActive, async (req, res): Promise<void> => {
  const { status } = req.query as { status?: string };
  let rows = await db.select().from(scrimsTable).orderBy(scrimsTable.scheduledAt);
  if (status) rows = rows.filter(s => s.status === status);

  const scrimsWithCounts = await Promise.all(rows.map(async (scrim) => {
    const signups = await db.select().from(scrimSignupsTable).where(eq(scrimSignupsTable.scrimId, scrim.id));
    return serializeScrim(scrim, signups.length);
  }));

  res.json(scrimsWithCounts);
});

router.post("/scrims", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const { opponentName, scheduledAt, gameMode, requiredPlayers, notes, imageUrl, linkUrl, linkLabel } = req.body as {
    opponentName?: string; scheduledAt?: string; gameMode?: string;
    requiredPlayers?: number; notes?: string; imageUrl?: string | null;
    linkUrl?: string | null; linkLabel?: string | null;
  };
  if (!opponentName || !scheduledAt) {
    res.status(400).json({ error: "opponentName and scheduledAt are required" });
    return;
  }

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
    createdBy: req.userId!,
  }).returning();

  const activeMembers = await db.select({ id: membersTable.id }).from(membersTable)
    .where(eq(membersTable.status, "active"));
  const notifications = activeMembers.map(m => ({
    id: randomUUID(),
    userId: m.id,
    type: "scrim" as const,
    title: `New Scrim vs ${created.opponentName}`,
    message: `A new scrim has been scheduled. Sign up now!`,
    read: false,
    link: `/scrims`,
  }));
  if (notifications.length > 0) {
    await db.insert(notificationsTable).values(notifications);
  }

  const signups = await db.select().from(scrimSignupsTable).where(eq(scrimSignupsTable.scrimId, created.id));
  res.status(201).json(serializeScrim(created, signups.length));
});

router.get("/scrims/:id", requireAuth, requireActive, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [scrim] = await db.select().from(scrimsTable).where(eq(scrimsTable.id, raw));
  if (!scrim) { res.status(404).json({ error: "Scrim not found" }); return; }
  const signups = await db.select().from(scrimSignupsTable).where(eq(scrimSignupsTable.scrimId, raw));
  res.json(serializeScrim(scrim, signups.length));
});

router.patch("/scrims/:id", requireAuth, requireActive, requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = req.body as Record<string, unknown>;
  const updateData: Record<string, unknown> = { ...body };
  if (body.scheduledAt) updateData.scheduledAt = new Date(body.scheduledAt as string);

  const [updated] = await db.update(scrimsTable).set(updateData as any).where(eq(scrimsTable.id, raw)).returning();
  if (!updated) { res.status(404).json({ error: "Scrim not found" }); return; }
  const signups = await db.select().from(scrimSignupsTable).where(eq(scrimSignupsTable.scrimId, raw));
  res.json(serializeScrim(updated, signups.length));
});

router.delete("/scrims/:id", requireAuth, requireActive, requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(scrimSignupsTable).where(eq(scrimSignupsTable.scrimId, raw));
  await db.delete(scrimsTable).where(eq(scrimsTable.id, raw));
  res.sendStatus(204);
});

router.post("/scrims/:id/join", requireAuth, requireActive, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = req.userId!;

  const existing = await db.select().from(scrimSignupsTable)
    .where(and(eq(scrimSignupsTable.scrimId, raw), eq(scrimSignupsTable.memberId, userId)));
  if (existing.length > 0) {
    res.json(serializeSignup(existing[0]));
    return;
  }

  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, userId));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }

  const [signup] = await db.insert(scrimSignupsTable).values({
    id: randomUUID(),
    scrimId: raw,
    memberId: userId,
    memberName: member.displayName,
    signupStatus: "pending",
  }).returning();

  res.json(serializeSignup(signup));
});

router.post("/scrims/:id/leave", requireAuth, requireActive, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(scrimSignupsTable)
    .where(and(eq(scrimSignupsTable.scrimId, raw), eq(scrimSignupsTable.memberId, req.userId!)));
  res.sendStatus(204);
});

router.get("/scrims/:id/signups", requireAuth, requireActive, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rows = await db.select().from(scrimSignupsTable).where(eq(scrimSignupsTable.scrimId, raw));
  res.json(rows.map(serializeSignup));
});

export default router;
