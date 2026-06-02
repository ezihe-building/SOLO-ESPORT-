import { Router, type IRouter } from "express";
import { db, membersTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireActive, requireManagement, type AuthRequest } from "../middlewares/auth";
import {
  ListMembersResponse,
  GetMemberResponse,
  UpdateMemberBody,
  UpdateMemberResponse,
  PromoteMemberBody,
  PromoteMemberResponse,
  DemoteMemberBody,
  DemoteMemberResponse,
  ApproveMemberResponse,
  RejectMemberResponse,
  ListPendingMembersResponse,
  ListOnlineMembersResponse,
  UpdateMyProfileBody,
  UpdateMyProfileResponse,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function serializeMember(m: typeof membersTable.$inferSelect) {
  return {
    ...m,
    lastSeen: m.lastSeen?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/members", requireAuth, requireActive, async (req: AuthRequest, res): Promise<void> => {
  const { status, role } = req.query as { status?: string; role?: string };
  let rows = await db.select().from(membersTable);
  if (status) rows = rows.filter(m => m.status === status);
  if (role) rows = rows.filter(m => m.role === role);
  res.json(ListMembersResponse.parse(rows.map(serializeMember)));
});

router.get("/members/pending", requireAuth, requireActive, requireManagement, async (_req, res): Promise<void> => {
  const rows = await db.select().from(membersTable).where(eq(membersTable.status, "pending"));
  res.json(ListPendingMembersResponse.parse(rows.map(serializeMember)));
});

router.get("/members/online", requireAuth, requireActive, async (_req, res): Promise<void> => {
  const rows = await db.select().from(membersTable).where(
    and(eq(membersTable.isOnline, true), eq(membersTable.status, "active"))
  );
  res.json(ListOnlineMembersResponse.parse(rows.map(serializeMember)));
});

router.patch("/members/profile", requireAuth, requireActive, async (req: AuthRequest, res): Promise<void> => {
  const { displayName, bio, avatarUrl, whatsappNumber, customTag, tiktokUsername, instagramUsername, discordUsername } = req.body as {
    displayName?: string; bio?: string; avatarUrl?: string | null; whatsappNumber?: string;
    customTag?: string; tiktokUsername?: string; instagramUsername?: string; discordUsername?: string;
  };
  const updateData: Record<string, unknown> = {};
  if (displayName !== undefined && displayName.trim()) updateData.displayName = displayName.trim();
  if (bio !== undefined) updateData.bio = bio;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
  if (customTag !== undefined) updateData.customTag = customTag;
  if (tiktokUsername !== undefined) updateData.tiktokUsername = tiktokUsername;
  if (instagramUsername !== undefined) updateData.instagramUsername = instagramUsername;
  if (discordUsername !== undefined) updateData.discordUsername = discordUsername;
  const [updated] = await db.update(membersTable).set(updateData as any).where(eq(membersTable.id, req.userId!)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(serializeMember(updated));
});

router.get("/members/:id", requireAuth, requireActive, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, raw));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(GetMemberResponse.parse(serializeMember(member)));
});

router.patch("/members/:id", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateMemberBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(membersTable).set(parsed.data).where(eq(membersTable.id, raw)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(UpdateMemberResponse.parse(serializeMember(updated)));
});

router.delete("/members/:id", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(membersTable).where(eq(membersTable.id, raw));
  res.sendStatus(204);
});

router.post("/members/:id/approve", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [updated] = await db.update(membersTable).set({ status: "active" }).where(eq(membersTable.id, raw)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  await db.insert(notificationsTable).values({
    id: randomUUID(), userId: raw, type: "approval",
    title: "Application Approved!",
    message: "Welcome to SOLOS+ ESPORTZ! Your application has been approved.",
    read: false, link: "/welcome",
  });
  res.json(ApproveMemberResponse.parse(serializeMember(updated)));
});

router.post("/members/:id/reject", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [updated] = await db.update(membersTable).set({ status: "rejected" }).where(eq(membersTable.id, raw)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(RejectMemberResponse.parse(serializeMember(updated)));
});

router.post("/members/:id/suspend", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { reason } = req.body as { reason?: string };
  const [updated] = await db.update(membersTable).set({ status: "suspended" as any }).where(eq(membersTable.id, raw)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  await db.insert(notificationsTable).values({
    id: randomUUID(), userId: raw, type: "system",
    title: "Account Suspended",
    message: reason ? `Your account has been suspended. Reason: ${reason}` : "Your account has been temporarily suspended by management.",
    read: false, link: "/rejected",
  });
  res.json(serializeMember(updated));
});

router.post("/members/:id/restore", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [updated] = await db.update(membersTable).set({ status: "active" }).where(eq(membersTable.id, raw)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  await db.insert(notificationsTable).values({
    id: randomUUID(), userId: raw, type: "system",
    title: "Account Restored",
    message: "Your account has been restored. You now have full access to SOLOS+ ESPORTZ.",
    read: false, link: "/dashboard",
  });
  res.json(serializeMember(updated));
});

router.post("/members/:id/tag", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { customTag } = req.body as { customTag?: string | null };
  const [updated] = await db.update(membersTable).set({ customTag: customTag ?? null }).where(eq(membersTable.id, raw)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  res.json({ id: updated.id, customTag: updated.customTag });
});

router.post("/members/:id/stats", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = req.body as {
    kills?: number; deaths?: number; kdRatio?: number;
    totalWins?: number; totalLosses?: number;
    mvpCount?: number; clanPoints?: number;
    activityScore?: number; tournamentWins?: number; scrimWins?: number;
  };
  const updateData: Record<string, unknown> = {};
  if (body.kills !== undefined) updateData.kills = Number(body.kills);
  if (body.deaths !== undefined) updateData.deaths = Number(body.deaths);
  if (body.kdRatio !== undefined) updateData.kdRatio = parseFloat(String(body.kdRatio));
  if (body.totalWins !== undefined) updateData.totalWins = Number(body.totalWins);
  if (body.totalLosses !== undefined) updateData.totalLosses = Number(body.totalLosses);
  if (body.mvpCount !== undefined) updateData.mvpCount = Number(body.mvpCount);
  if (body.clanPoints !== undefined) updateData.clanPoints = Number(body.clanPoints);
  if (body.activityScore !== undefined) updateData.activityScore = Number(body.activityScore);
  if (body.tournamentWins !== undefined) updateData.tournamentWins = Number(body.tournamentWins);
  if (body.scrimWins !== undefined) updateData.scrimWins = Number(body.scrimWins);
  const [updated] = await db.update(membersTable).set(updateData as any).where(eq(membersTable.id, raw)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(serializeMember(updated));
});

router.post("/members/:id/badges", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { achievements } = req.body as { achievements: string[] };
  const [updated] = await db.update(membersTable).set({ achievements: achievements ?? [] }).where(eq(membersTable.id, raw)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(serializeMember(updated));
});

router.post("/members/:id/promote", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = PromoteMemberBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(membersTable).set({ role: parsed.data.role as any }).where(eq(membersTable.id, raw)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  await db.insert(notificationsTable).values({
    id: randomUUID(), userId: raw, type: "promotion",
    title: "Congratulations! You've been promoted!",
    message: `You have been promoted to ${parsed.data.role} in SOLOS+ ESPORTZ.`,
    read: false, link: "/profile",
  });
  res.json(PromoteMemberResponse.parse(serializeMember(updated)));
});

router.post("/members/:id/demote", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DemoteMemberBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(membersTable).set({ role: parsed.data.role as any }).where(eq(membersTable.id, raw)).returning();
  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }
  await db.insert(notificationsTable).values({
    id: randomUUID(), userId: raw, type: "demotion",
    title: "Role Updated",
    message: `Your role has been changed to ${parsed.data.role}.`,
    read: false, link: "/profile",
  });
  res.json(DemoteMemberResponse.parse(serializeMember(updated)));
});

export default router;
