import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/http";
import { requireAuth } from "../../middleware/auth.middleware";
import { HttpError } from "../../lib/errors";

export const usersRouter = Router();

usersRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        role: true,
        language: true,
        xp: true,
        streak: true,
        offlineEnabled: true,
        createdAt: true,
      },
    });

    res.status(200).json({ user });
  }),
);

usersRouter.get(
  "/:userId",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ userId: z.string().min(1) });
    const { userId } = paramsSchema.parse(req.params);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        language: true,
        xp: true,
        streak: true,
        createdAt: true,
      },
    });

    if (!user) throw new HttpError(404, "User not found");
    res.status(200).json({ user });
  }),
);

usersRouter.patch(
  "/me/preferences",
  requireAuth,
  asyncHandler(async (req, res) => {
    const bodySchema = z.object({
      language: z.string().min(2).max(10).optional(),
      offlineEnabled: z.boolean().optional(),
    });
    const body = bodySchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        language: body.language ?? undefined,
        offlineEnabled: body.offlineEnabled ?? undefined,
      },
      select: { id: true, language: true, offlineEnabled: true },
    });

    res.status(200).json({ user });
  }),
);

usersRouter.get(
  "/me/analytics",
  requireAuth,
  asyncHandler(async (req, res) => {
    const analytics = await prisma.userAnalytics.findUnique({
      where: { userId: req.user!.id },
    });

    const fallback = analytics
      ? null
      : await prisma.userAnalytics.create({
          data: { userId: req.user!.id },
        });

    res.status(200).json({ analytics: analytics ?? fallback });
  }),
);

