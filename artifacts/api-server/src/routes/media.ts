import { Router, type IRouter } from "express";
import { db, mediaGalleryTable, membersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireActive, requireManagement, type AuthRequest } from "../middlewares/auth";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function serializeMedia(m: typeof mediaGalleryTable.$inferSelect) {
  return {
    ...m,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/media", requireAuth, requireActive, async (_req, res): Promise<void> => {
  const rows = await db.select().from(mediaGalleryTable).orderBy(desc(mediaGalleryTable.createdAt));
  res.json(rows.map(serializeMedia));
});

router.post("/media", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const { title, imageUrl, category } = req.body as {
    title: string; imageUrl: string; category?: string;
  };
  if (!title || !imageUrl) { res.status(400).json({ error: "title and imageUrl required" }); return; }
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.userId!));
  const [created] = await db.insert(mediaGalleryTable).values({
    id: randomUUID(),
    title,
    imageUrl,
    category: (category as any) ?? "clan_life",
    uploadedBy: req.userId!,
    uploadedByName: member?.displayName ?? "Management",
  }).returning();
  res.status(201).json(serializeMedia(created));
});

router.delete("/media/:id", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(mediaGalleryTable).where(eq(mediaGalleryTable.id, id));
  res.sendStatus(204);
});

export default router;
