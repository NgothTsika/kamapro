import { Router } from "express";
import { authRouter } from "../modules/auth/auth.controller";
import { contentRouter } from "../modules/content/content.controller";
import { progressRouter } from "../modules/progress/progress.controller";
import { gameRouter } from "../modules/game/game.controller";
import { leaderboardRouter } from "../modules/leaderboard/leaderboard.controller";
import { socialRouter } from "../modules/social/social.controller";
import { communityRouter } from "../modules/community/community.controller";
import { notificationsRouter } from "../modules/notifications/notifications.controller";
import { searchRouter } from "../modules/search/search.controller";
import { moderationRouter } from "../modules/moderation/moderation.controller";
import { feedbackRouter } from "../modules/feedback/feedback.controller";
import { quizRouter } from "../modules/quiz/quiz.controller";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/content", contentRouter);
apiRouter.use("/progress", progressRouter);
apiRouter.use("/game", gameRouter);
apiRouter.use("/leaderboard", leaderboardRouter);
apiRouter.use("/social", socialRouter);
apiRouter.use("/community", communityRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/search", searchRouter);
apiRouter.use("/moderation", moderationRouter);
apiRouter.use("/feedback", feedbackRouter);
apiRouter.use("/quiz", quizRouter);
