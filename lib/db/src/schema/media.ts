import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mediaCategoryEnum = pgEnum("media_category", [
  "tournament", "scrim", "clan_life", "achievement", "highlight",
]);

export const mediaGalleryTable = pgTable("media_gallery", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  category: mediaCategoryEnum("category").notNull().default("clan_life"),
  uploadedBy: text("uploaded_by").notNull(),
  uploadedByName: text("uploaded_by_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMediaSchema = createInsertSchema(mediaGalleryTable).omit({ createdAt: true });
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = typeof mediaGalleryTable.$inferSelect;
