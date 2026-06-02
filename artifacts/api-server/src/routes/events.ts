import { Router, type IRouter } from "express";
import { db, eventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireActive, requireManagement, type AuthRequest } from "../middlewares/auth";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function serializeEvent(e: typeof eventsTable.$inferSelect) {
  return {
    ...e,
    eventDate: e.eventDate.toISOString(),
    createdAt: e.createdAt.toISOString(),
  };
}

router.get("/events", requireAuth, requireActive, async (_req, res): Promise<void> => {
  const rows = await db.select().from(eventsTable).orderBy(desc(eventsTable.eventDate));
  res.json(rows.map(serializeEvent));
});

router.post("/events", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const { title, description, imageUrl, eventDate } = req.body as {
    title: string; description: string; imageUrl?: string; eventDate: string;
  };
  if (!title || !description || !eventDate) {
    res.status(400).json({ error: "title, description and eventDate required" });
    return;
  }
  const memberRows = await db.query?.members?.findFirst?.({ where: (m: any, { eq: eqFn }: any) => eqFn(m.id, req.userId!) }) ?? null;
  const [created] = await db.insert(eventsTable).values({
    id: randomUUID(),
    title,
    description,
    imageUrl: imageUrl ?? null,
    eventDate: new Date(eventDate),
    createdBy: req.userId!,
    createdByName: (req as any).memberName ?? "Management",
  }).returning();
  res.status(201).json(serializeEvent(created));
});

router.patch("/events/:id", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { title, description, imageUrl, eventDate } = req.body as {
    title?: string; description?: string; imageUrl?: string | null; eventDate?: string;
  };
  const updateData: Record<string, unknown> = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (eventDate) updateData.eventDate = new Date(eventDate);
  const [updated] = await db.update(eventsTable).set(updateData as any).where(eq(eventsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Event not found" }); return; }
  res.json(serializeEvent(updated));
});

router.delete("/events/:id", requireAuth, requireActive, requireManagement, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.sendStatus(204);
});

export default router;
