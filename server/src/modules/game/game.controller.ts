import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/http";
import { requireAuth } from "../../middleware/auth.middleware";
import { HttpError } from "../../lib/errors";

export const gameRouter = Router();

const createMatchBodySchema = z.object({
  topicId: z.string().optional(),
  // Ordered list of quiz question IDs (Quiz.id) for the match rounds.
  quizPool: z.array(z.string().min(1)).min(1),
  maxRounds: z.number().int().min(1).max(50).optional(),
});

gameRouter.post(
  "/matches",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = createMatchBodySchema.parse(req.body);
    const { quizPool, topicId } = body;

    const match = await prisma.gameMatch.create({
      data: {
        player1Id: req.user!.id,
        player2Id: req.user!.id, // will be overwritten on join (see below)
        winnerId: null,
        status: "WAITING",
        topicId: topicId ?? null,
        quizPool: quizPool.length <= 100 ? quizPool : quizPool.slice(0, 100),
        maxRounds: body.maxRounds ?? 5,
        playerCount: 2,
        heartsPlayer1: 3,
        heartsPlayer2: 3,
      },
    });

    // Immediately null-out player2Id to represent "not joined yet".
    // Prisma model has non-null player2Id; so we use CANCELLED/WAITING semantics.
    // For correctness, we create join endpoint to enforce player2Id replacement.
    res.status(201).json({ matchId: match.id });
  }),
);

const joinMatchBodySchema = z.object({
  matchId: z.string().min(1),
});

gameRouter.post(
  "/matches/join",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = joinMatchBodySchema.parse(req.body);
    const match = await prisma.gameMatch.findUnique({
      where: { id: body.matchId },
      select: {
        id: true,
        status: true,
        player1Id: true,
        player2Id: true,
      },
    });

    if (!match) throw new HttpError(404, "Match not found");
    if (match.status !== "WAITING") {
      throw new HttpError(400, "Match is not joinable");
    }
    if (match.player1Id === req.user!.id) {
      throw new HttpError(400, "You cannot join your own match");
    }

    // We replace player2Id in WAITING state; schema makes player2Id required.
    const updated = await prisma.gameMatch.update({
      where: { id: match.id },
      data: { player2Id: req.user!.id },
    });

    res.status(200).json({ match: updated });
  }),
);

gameRouter.post(
  "/matches/:matchId/start",
  requireAuth,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ matchId: z.string().min(1) });
    const { matchId } = paramsSchema.parse(req.params);
    const match = await prisma.gameMatch.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        status: true,
        quizPool: true,
        maxRounds: true,
      },
    });

    if (!match) throw new HttpError(404, "Match not found");
    if (match.status !== "WAITING" && match.status !== "IN_PROGRESS") {
      throw new HttpError(400, "Match cannot be started");
    }

    const quizPool = (match.quizPool ?? []) as unknown[];
    const pool = quizPool.filter((x) => typeof x === "string") as string[];
    if (pool.length === 0) {
      throw new HttpError(400, "Match quizPool is empty");
    }

    const roundsToCreate = pool.slice(0, match.maxRounds ?? pool.length);

    const existingRoundsCount = await prisma.gameRound.count({
      where: { matchId },
    });
    if (existingRoundsCount > 0) {
      const updated = await prisma.gameMatch.update({
        where: { id: match.id },
        data: { status: "IN_PROGRESS" },
      });
      return res.status(200).json({ match: updated });
    }

    await prisma.gameRound.createMany({
      data: roundsToCreate.map((questionId, i) => ({
        matchId,
        questionId,
        order: i,
      })),
    });

    const rounds = await prisma.gameRound.findMany({
      where: { matchId },
      orderBy: { order: "asc" },
    });

    const updated = await prisma.gameMatch.update({
      where: { id: match.id },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });

    res.status(201).json({ match: updated, rounds });
  }),
);

const answerRoundBodySchema = z.object({
  answerIndex: z.number().int().min(0).max(10),
});

gameRouter.post(
  "/matches/:matchId/rounds/:roundId/answer",
  requireAuth,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      matchId: z.string().min(1),
      roundId: z.string().min(1),
    });
    const { matchId, roundId } = paramsSchema.parse(req.params);
    const { answerIndex } = answerRoundBodySchema.parse(req.body);

    const match = await prisma.gameMatch.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        status: true,
        player1Id: true,
        player2Id: true,
        heartsPlayer1: true,
        heartsPlayer2: true,
      },
    });
    if (!match) throw new HttpError(404, "Match not found");

    if (match.status !== "IN_PROGRESS") {
      throw new HttpError(400, "Match not in progress");
    }
    if (match.player1Id !== req.user!.id && match.player2Id !== req.user!.id) {
      throw new HttpError(403, "You are not a player in this match");
    }

    const round = await prisma.gameRound.findUnique({
      where: { id: roundId },
      select: {
        id: true,
        matchId: true,
        questionId: true,
        player1Answer: true,
        player2Answer: true,
      },
    });
    if (!round || round.matchId !== matchId) {
      throw new HttpError(404, "Round not found");
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: round.questionId },
      select: {
        correctOption: true,
        lesson: { select: { xpReward: true } },
      },
    });
    if (!quiz) throw new HttpError(404, "Quiz question not found");

    // Identify which player's slot this is.
    const isPlayer1 = match.player1Id === req.user!.id;

    const alreadyAnswered = isPlayer1
      ? round.player1Answer !== null
      : round.player2Answer !== null;
    if (alreadyAnswered) {
      throw new HttpError(409, "You already answered this round");
    }

    const correct = answerIndex === quiz.correctOption;
    const xpEarned = quiz.lesson?.xpReward ?? 10;

    // Apply all state changes in a single transaction.
    const payload = await prisma.$transaction(async (tx) => {
      // Update round answers + correctness + heart-loss marker.
      const updatedRound = await tx.gameRound.update({
        where: { id: roundId },
        data: {
          ...(isPlayer1
            ? {
                player1Answer: answerIndex,
                player1Correct: correct,
                player1HeartLost: !correct,
              }
            : {
                player2Answer: answerIndex,
                player2Correct: correct,
                player2HeartLost: !correct,
              }),
        },
      });

      // Update match hearts.
      const heartsPlayer1 = isPlayer1 ? match.heartsPlayer1 - (correct ? 0 : 1) : match.heartsPlayer1;
      const heartsPlayer2 = !isPlayer1 ? match.heartsPlayer2 - (correct ? 0 : 1) : match.heartsPlayer2;

      const updatedMatch = await tx.gameMatch.update({
        where: { id: matchId },
        data: {
          heartsPlayer1,
          heartsPlayer2,
        },
      });

      // Award XP and leaderboard total for correct answers.
      if (correct) {
        await tx.user.update({
          where: { id: req.user!.id },
          data: { xp: { increment: xpEarned } },
        });
        await tx.leaderboard.upsert({
          where: { userId: req.user!.id },
          create: { userId: req.user!.id, totalXp: xpEarned },
          update: { totalXp: { increment: xpEarned } },
        });
      }

      // Check finish state.
      const rounds = await tx.gameRound.findMany({
        where: { matchId },
        orderBy: { order: "asc" },
      });
      const allAnswered = rounds.every(
        (r) => r.player1Answer !== null && r.player2Answer !== null,
      );

      const finished = heartsPlayer1 <= 0 || heartsPlayer2 <= 0 || allAnswered;
      if (!finished) {
        return { updatedRound, updatedMatch, finished: false };
      }

      let winnerId: string | null = null;

      if (heartsPlayer1 <= 0) winnerId = match.player2Id;
      else if (heartsPlayer2 <= 0) winnerId = match.player1Id;
      else {
        const p1Correct = rounds.filter((r) => r.player1Correct).length;
        const p2Correct = rounds.filter((r) => r.player2Correct).length;
        if (p1Correct > p2Correct) winnerId = match.player1Id;
        else if (p2Correct > p1Correct) winnerId = match.player2Id;
      }

      const updated = await tx.gameMatch.update({
        where: { id: matchId },
        data: {
          status: "FINISHED",
          endedAt: new Date(),
          winnerId,
        },
      });

      if (winnerId) {
        await tx.leaderboard.updateMany({
          where: { userId: winnerId },
          data: { gamesWon: { increment: 1 } },
        });
      }

      return { updatedRound, updatedMatch: updated, finished: true, winnerId };
    });

    res.status(200).json(payload);
  }),
);

gameRouter.get(
  "/matches/:matchId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ matchId: z.string().min(1) });
    const { matchId } = paramsSchema.parse(req.params);
    const match = await prisma.gameMatch.findUnique({
      where: { id: matchId },
      include: {
        rounds: { orderBy: { order: "asc" } },
        topic: true,
      },
    });
    if (!match) throw new HttpError(404, "Match not found");
    if (match.player1Id !== req.user!.id && match.player2Id !== req.user!.id) {
      throw new HttpError(403, "Forbidden");
    }
    res.status(200).json({ match });
  }),
);

