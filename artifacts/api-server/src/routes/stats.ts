import { Router, type IRouter } from "express";
import { db, membersTable, scrimsTable } from "@workspace/db";
import { requireAuth, requireActive } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/stats/clan", requireAuth, requireActive, async (_req, res): Promise<void> => {
  const members = await db.select().from(membersTable);
  const scrims = await db.select().from(scrimsTable);

  const active = members.filter(m => m.status === "active");
  const pending = members.filter(m => m.status === "pending");

  const totalClanPoints = active.reduce((sum, m) => sum + m.clanPoints, 0);
  const totalMvps = active.reduce((sum, m) => sum + m.mvpCount, 0);
  const avgKd = active.length > 0
    ? active.reduce((sum, m) => sum + m.kdRatio, 0) / active.length
    : 0;

  const completedScrims = scrims.filter(s => s.status === "completed");
  const scrimWins = completedScrims.filter(s => s.result === "win").length;
  const scrimWinRate = completedScrims.length > 0
    ? (scrimWins / completedScrims.length) * 100
    : 0;

  res.json({
    totalMembers: members.length,
    activeMembers: active.length,
    pendingMembers: pending.length,
    tier1Count: active.filter(m => m.role === "TIER1").length,
    tier2Count: active.filter(m => m.role === "TIER2").length,
    tier3Count: active.filter(m => m.role === "TIER3").length,
    newMemberCount: active.filter(m => m.role === "NEW_MEMBER").length,
    totalScrims: scrims.length,
    scrimWins,
    scrimWinRate: Math.round(scrimWinRate * 10) / 10,
    totalTournaments: 32,
    avgKd: Math.round(avgKd * 100) / 100,
    totalClanPoints,
    totalMvps,
    membersOnline: active.filter(m => m.isOnline).length,
  });
});

export default router;
