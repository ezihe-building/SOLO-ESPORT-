import { Router, type IRouter } from "express";
import { db, feedPostsTable, membersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireActive, requireManagement, type AuthRequest } from "../middlewares/auth";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function serializePost(p: typeof feedPostsTable.$inferSelect) {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/feed", requireAuth, requireActive, async (_req, res): Promise<void> => {
  const rows = await db.select().from(feedPostsTable).orderBy(desc(feedPostsTable.createdAt)).limit(50);
  res.json(rows.map(serializePost));
});

router.post("/feed", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const { content, imageUrl, postType } = req.body as {
    content: string; imageUrl?: string; postType?: string;
  };
  if (!content) { res.status(400).json({ error: "content required" }); return; }
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.userId!));
  const [created] = await db.insert(feedPostsTable).values({
    id: randomUUID(),
    authorId: req.userId!,
    authorName: member?.displayName ?? "Management",
    authorRole: member?.role ?? "MANAGEMENT",
    content,
    imageUrl: imageUrl ?? null,
    postType: (postType as any) ?? "news",
    likeCount: 0,
    likedBy: [],
  }).returning();
  res.status(201).json(serializePost(created));
});

router.post("/feed/:id/like", requireAuth, requireActive, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = req.userId!;
  const [post] = await db.select().from(feedPostsTable).where(eq(feedPostsTable.id, id));
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  const alreadyLiked = post.likedBy.includes(userId);
  const newLikedBy = alreadyLiked ? post.likedBy.filter(u => u !== userId) : [...post.likedBy, userId];
  const [updated] = await db.update(feedPostsTable).set({
    likeCount: newLikedBy.length,
    likedBy: newLikedBy,
  }).where(eq(feedPostsTable.id, id)).returning();
  res.json(serializePost(updated));
});

router.delete("/feed/:id", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(feedPostsTable).where(eq(feedPostsTable.id, id));
  res.sendStatus(204);
});

export default router;
