import { pgTable, text, integer, real, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["OWNER", "MANAGEMENT", "TIER1", "TIER2", "TIER3", "NEW_MEMBER"]);
export const memberStatusEnum = pgEnum("member_status", ["pending", "active", "rejected", "kicked", "suspended"]);

export const membersTable = pgTable("members", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  codmUsername: text("codm_username").notNull(),
  displayName: text("display_name").notNull(),
  whatsappNumber: text("whatsapp_number"),
  tiktokUsername: text("tiktok_username"),
  instagramUsername: text("instagram_username"),
  discordUsername: text("discord_username"),
  customTag: text("custom_tag"),
  role: roleEnum("role").notNull().default("NEW_MEMBER"),
  status: memberStatusEnum("status").notNull().default("pending"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  clanPoints: integer("clan_points").notNull().default(0),
  kills: integer("kills").notNull().default(0),
  deaths: integer("deaths").notNull().default(0),
  kdRatio: real("kd_ratio").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  totalLosses: integer("total_losses").notNull().default(0),
  mvpCount: integer("mvp_count").notNull().default(0),
  activityScore: integer("activity_score").notNull().default(0),
  tournamentWins: integer("tournament_wins").notNull().default(0),
  scrimWins: integer("scrim_wins").notNull().default(0),
  isOnline: boolean("is_online").notNull().default(false),
  lastSeen: timestamp("last_seen"),
  achievements: text("achievements").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMemberSchema = createInsertSchema(membersTable).omit({ createdAt: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof membersTable.$inferSelect;
