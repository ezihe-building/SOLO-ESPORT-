import { Router, type IRouter } from "express";
import { db, membersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireActive } from "../middlewares/auth";
import { GetLeaderboardResponse, GetTopPlayersResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function toEntry(m: typeof membersTable.$inferSelect, rank: number) {
  return {
    rank,
    memberId: m.id,
    displayName: m.displayName,
    role: m.role,
    avatarUrl: m.avatarUrl ?? null,
    clanPoints: m.clanPoints,
    kdRatio: m.kdRatio,
    mvpCount: m.mvpCount,
    activityScore: m.activityScore,
    scrimWins: m.scrimWins,
  };
}

router.get("/leaderboard", requireAuth, requireActive, async (req, res): Promise<void> => {
  const sortBy = (req.query.sortBy as string) ?? "clanPoints";
  const limit = req.query.limit ? Number(req.query.limit) : 50;

  const sortMap: Record<string, typeof membersTable.clanPoints> = {
    clanPoints: membersTable.clanPoints,
    kdRatio: membersTable.kdRatio as any,
    mvpCount: membersTable.mvpCount as any,
    activityScore: membersTable.activityScore as any,
    scrimWins: membersTable.scrimWins as any,
  };

  const sortCol = sortMap[sortBy] ?? membersTable.clanPoints;
  const rows = await db.select().from(membersTable)
    .where(eq(membersTable.status, "active"))
    .orderBy(desc(sortCol))
    .limit(limit);

  res.json(GetLeaderboardResponse.parse(rows.map((m, i) => toEntry(m, i + 1))));
});

router.get("/leaderboard/top", requireAuth, requireActive, async (_req, res): Promise<void> => {
  const active = await db.select().from(membersTable).where(eq(membersTable.status, "active"));

  const byPoints = [...active].sort((a, b) => b.clanPoints - a.clanPoints)[0];
  const byKd = [...active].sort((a, b) => b.kdRatio - a.kdRatio)[0];
  const byMvp = [...active].sort((a, b) => b.mvpCount - a.mvpCount)[0];
  const byActivity = [...active].sort((a, b) => b.activityScore - a.activityScore)[0];
  const byScrimWins = [...active].sort((a, b) => b.scrimWins - a.scrimWins)[0];

  const fallback = active[0] ?? {
    id: "none", displayName: "N/A", role: "NEW_MEMBER", avatarUrl: null,
    clanPoints: 0, kdRatio: 0, mvpCount: 0, activityScore: 0, scrimWins: 0,
  };

  res.json(GetTopPlayersResponse.parse({
    byPoints: toEntry(byPoints ?? fallback, 1),
    byKd: toEntry(byKd ?? fallback, 1),
    byMvp: toEntry(byMvp ?? fallback, 1),
    byActivity: toEntry(byActivity ?? fallback, 1),
    byScrimWins: toEntry(byScrimWins ?? fallback, 1),
  }));
});

export default router;
