import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feedPostTypeEnum = pgEnum("feed_post_type", [
  "news", "tournament", "achievement", "screenshot", "promotion", "highlight", "scrim_result"
]);

export const feedPostsTable = pgTable("feed_posts", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  postType: feedPostTypeEnum("post_type").notNull().default("news"),
  likeCount: integer("like_count").notNull().default(0),
  likedBy: text("liked_by").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFeedPostSchema = createInsertSchema(feedPostsTable).omit({ createdAt: true });
export type InsertFeedPost = z.infer<typeof insertFeedPostSchema>;
export type FeedPost = typeof feedPostsTable.$inferSelect;
