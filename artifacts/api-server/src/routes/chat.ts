import { Router, type IRouter } from "express";
import { db, chatGroupsTable, chatMessagesTable, membersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireActive, type AuthRequest } from "../middlewares/auth";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const ROLE_GROUP_MAP: Record<string, string[]> = {
  OWNER: ["TIER1", "TIER2", "TIER3", "NEW_MEMBER", "MANAGEMENT", "GENERAL"],
  MANAGEMENT: ["TIER1", "TIER2", "TIER3", "NEW_MEMBER", "MANAGEMENT", "GENERAL"],
  TIER1: ["TIER1", "GENERAL"],
  TIER2: ["TIER2", "GENERAL"],
  TIER3: ["TIER3", "GENERAL"],
  NEW_MEMBER: ["NEW_MEMBER", "GENERAL"],
};

router.get("/chat/groups", requireAuth, requireActive, async (req: AuthRequest, res): Promise<void> => {
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.userId!));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }

  const allowedTypes = ROLE_GROUP_MAP[member.role] ?? ["GENERAL"];
  const allGroups = await db.select().from(chatGroupsTable);
  const accessible = allGroups.filter(g => allowedTypes.includes(g.type));

  const groupsWithMeta = await Promise.all(accessible.map(async (g) => {
    const messages = await db.select().from(chatMessagesTable)
      .where(eq(chatMessagesTable.groupId, g.id))
      .orderBy(desc(chatMessagesTable.createdAt))
      .limit(1);
    const lastMsg = messages[0];
    return {
      ...g,
      createdAt: g.createdAt.toISOString(),
      lastMessage: lastMsg?.content ?? null,
      lastMessageAt: lastMsg?.createdAt.toISOString() ?? null,
      unreadCount: 0,
    };
  }));

  res.json(groupsWithMeta);
});

router.get("/chat/groups/:groupId/messages", requireAuth, requireActive, async (req, res): Promise<void> => {
  const groupId = Array.isArray(req.params.groupId) ? req.params.groupId[0] : req.params.groupId;
  const rows = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.groupId, groupId))
    .orderBy(chatMessagesTable.createdAt)
    .limit(100);

  res.json(rows.map(m => ({
    ...m,
    avatarUrl: m.avatarUrl ?? null,
    createdAt: m.createdAt.toISOString(),
  })));
});

router.post("/chat/groups/:groupId/messages", requireAuth, requireActive, async (req: AuthRequest, res): Promise<void> => {
  const groupId = Array.isArray(req.params.groupId) ? req.params.groupId[0] : req.params.groupId;
  const { content } = req.body as { content?: string };
  if (!content?.trim()) { res.status(400).json({ error: "content is required" }); return; }

  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.userId!));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }

  const [msg] = await db.insert(chatMessagesTable).values({
    id: randomUUID(),
    groupId,
    authorId: req.userId!,
    authorName: member.displayName,
    authorRole: member.role,
    avatarUrl: member.avatarUrl ?? null,
    content: content.trim(),
  }).returning();

  res.status(201).json({
    ...msg,
    avatarUrl: msg.avatarUrl ?? null,
    createdAt: msg.createdAt.toISOString(),
  });
});

router.delete("/chat/groups/:groupId/messages/:messageId", requireAuth, requireActive, async (req: AuthRequest, res): Promise<void> => {
  const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
  const [msg] = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.id, messageId));
  if (!msg) { res.status(404).json({ error: "Message not found" }); return; }

  const isOwner = msg.authorId === req.userId;
  const isManagement = ["OWNER", "MANAGEMENT"].includes(req.memberRole ?? "");
  if (!isOwner && !isManagement) {
    res.status(403).json({ error: "Cannot delete this message" });
    return;
  }

  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.id, messageId));
  res.sendStatus(204);
});

export default router;
