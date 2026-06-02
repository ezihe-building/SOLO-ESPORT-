import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scrimStatusEnum = pgEnum("scrim_status", ["upcoming", "ongoing", "completed", "cancelled"]);
export const scrimResultEnum = pgEnum("scrim_result", ["win", "loss", "draw"]);
export const signupStatusEnum = pgEnum("signup_status", ["pending", "accepted", "declined"]);

export const scrimsTable = pgTable("scrims", {
  id: text("id").primaryKey(),
  opponentName: text("opponent_name").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  gameMode: text("game_mode").notNull(),
  requiredPlayers: integer("required_players").notNull().default(5),
  notes: text("notes"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  linkLabel: text("link_label"),
  resultImageUrl: text("result_image_url"),
  status: scrimStatusEnum("status").notNull().default("upcoming"),
  result: scrimResultEnum("result"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scrimSignupsTable = pgTable("scrim_signups", {
  id: text("id").primaryKey(),
  scrimId: text("scrim_id").notNull(),
  memberId: text("member_id").notNull(),
  memberName: text("member_name").notNull(),
  memberRole: text("member_role").notNull(),
  signupStatus: signupStatusEnum("signup_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScrimSchema = createInsertSchema(scrimsTable).omit({ createdAt: true });
export const insertScrimSignupSchema = createInsertSchema(scrimSignupsTable).omit({ createdAt: true });
export type InsertScrim = z.infer<typeof insertScrimSchema>;
export type Scrim = typeof scrimsTable.$inferSelect;
export type ScrimSignup = typeof scrimSignupsTable.$inferSelect;
