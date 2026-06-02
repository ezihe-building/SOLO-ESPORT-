import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import membersRouter from "./members";
import announcementsRouter from "./announcements";
import scrimsRouter from "./scrims";
import leaderboardRouter from "./leaderboard";
import chatRouter from "./chat";
import notificationsRouter from "./notifications";
import statsRouter from "./stats";
import mgmtRouter from "./mgmt";
import eventsRouter from "./events";
import feedRouter from "./feed";
import mediaRouter from "./media";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(membersRouter);
router.use(announcementsRouter);
router.use(scrimsRouter);
router.use(leaderboardRouter);
router.use(chatRouter);
router.use(notificationsRouter);
router.use(statsRouter);
router.use(mgmtRouter);
router.use(eventsRouter);
router.use(feedRouter);
router.use(mediaRouter);
router.use(uploadRouter);

export default router;
