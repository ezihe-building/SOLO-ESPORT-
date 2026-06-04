import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scrimStatusEnum = pgEnum("scrim_status", ["upcoming", "ongoing", "completed", "cancelled"]);
export const scrimResultEnum = pgEnum("scrim_result", ["win", "loss", "draw"]);

export const scrimsTable = pgTable("scrims", {
  id: text("id").primaryKey(),
  opponentName: text("opponent_name").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  gameMode: text("game_mode").notNull().default("Battle Royale"),
  requiredPlayers: integer("required_players").notNull().default(5),
  notes: text("notes"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  linkLabel: text("link_label"),
  status: scrimStatusEnum("status").notNull().default("upcoming"),
  result: scrimResultEnum("result"),
  resultImageUrl: text("result_image_url"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scrimSignupsTable = pgTable("scrim_signups", {
  id: text("id").primaryKey(),
  scrimId: text("scrim_id").notNull().references(() => scrimsTable.id, { onDelete: "cascade" }),
  memberId: text("member_id").notNull(),
  memberName: text("member_name").notNull(),
  signupStatus: text("signup_status").notNull().default("signed_up"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScrimSchema = createInsertSchema(scrimsTable).omit({ createdAt: true });
export type InsertScrim = z.infer<typeof insertScrimSchema>;
export type Scrim = typeof scrimsTable.$inferSelect;
