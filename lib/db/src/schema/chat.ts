import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chatGroupTypeEnum = pgEnum("chat_group_type", ["TIER1", "TIER2", "TIER3", "NEW_MEMBER", "MANAGEMENT", "GENERAL"]);

export const chatGroupsTable = pgTable("chat_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: chatGroupTypeEnum("type").notNull(),
  memberCount: integer("member_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull(),
  avatarUrl: text("avatar_url"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChatGroupSchema = createInsertSchema(chatGroupsTable).omit({ createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ createdAt: true });
export type InsertChatGroup = z.infer<typeof insertChatGroupSchema>;
export type ChatGroup = typeof chatGroupsTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
