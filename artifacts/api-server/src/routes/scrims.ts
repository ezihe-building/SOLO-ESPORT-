import { Router, type IRouter } from "express";
import { db, scrimsTable, scrimSignupsTable, membersTable, notificationsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireActive, requireManagement, type AuthRequest } from "../middlewares/auth";
import {
  ListScrimsResponse,
  GetScrimResponse,
  CreateScrimBody,
  UpdateScrimBody,
  JoinScrimResponse,
  ListScrimSignupsResponse,
} from "@workspace/api-zod";
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

  res.json(ListScrimsResponse.parse(scrimsWithCounts));
});

router.post("/scrims", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateScrimBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [created] = await db.insert(scrimsTable).values({
    id: randomUUID(),
    ...parsed.data,
    scheduledAt: new Date(parsed.data.scheduledAt),
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

  res.status(201).json(GetScrimResponse.parse(serializeScrim(created, 0)));
});

router.get("/scrims/:id", requireAuth, requireActive, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [scrim] = await db.select().from(scrimsTable).where(eq(scrimsTable.id, raw));
  if (!scrim) { res.status(404).json({ error: "Scrim not found" }); return; }
  const signups = await db.select().from(scrimSignupsTable).where(eq(scrimSignupsTable.scrimId, raw));
  res.json(GetScrimResponse.parse(serializeScrim(scrim, signups.length)));
});

router.patch("/scrims/:id", requireAuth, requireActive, requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateScrimBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.scheduledAt) updateData.scheduledAt = new Date(parsed.data.scheduledAt);

  const [updated] = await db.update(scrimsTable).set(updateData as any).where(eq(scrimsTable.id, raw)).returning();
  if (!updated) { res.status(404).json({ error: "Scrim not found" }); return; }
  const signups = await db.select().from(scrimSignupsTable).where(eq(scrimSignupsTable.scrimId, raw));
  res.json(GetScrimResponse.parse(serializeScrim(updated, signups.length)));
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
    res.json(JoinScrimResponse.parse(serializeSignup(existing[0])));
    return;
  }

  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, userId));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }

  const [signup] = await db.insert(scrimSignupsTable).values({
    id: randomUUID(),
    scrimId: raw,
    memberId: userId,
    memberName: member.displayName,
    memberRole: member.role,
    signupStatus: "pending",
  }).returning();

  res.json(JoinScrimResponse.parse(serializeSignup(signup)));
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
  res.json(ListScrimSignupsResponse.parse(rows.map(serializeSignup)));
});

export default router;
