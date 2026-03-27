import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/http";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

export const achievementsRouter = Router();

// Public catalog (for UI badges list)
achievementsRouter.get(
  "/catalog",
  asyncHandler(async (_req, res) => {
    const achievements = await prisma.achievement.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ achievements });
  }),
);

// User earned achievements (duplicate of /progress/achievements, but often used by UI)
achievementsRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const earned = await prisma.userAchievement.findMany({
      where: { userId: req.user!.id },
      orderBy: { earnedAt: "desc" },
      include: { achievement: true },
    });
    res.status(200).json({ earned });
  }),
);

// Admin: create achievements
achievementsRouter.post(
  "/catalog",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const bodySchema = z.object({
      name: z.string().min(1).max(200),
      description: z.string().min(1).max(2000),
      icon: z.string().optional(),
      xpRequired: z.number().int().positive().optional(),
      streakRequired: z.number().int().positive().optional(),
    });
    const body = bodySchema.parse(req.body);

    const created = await prisma.achievement.create({ data: body });
    res.status(201).json({ achievement: created });
  }),
);

