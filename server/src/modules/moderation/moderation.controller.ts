import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/http";
import { requireAuth } from "../../middleware/auth.middleware";
import { HttpError } from "../../lib/errors";

export const moderationRouter = Router();

moderationRouter.post(
  "/submissions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const bodySchema = z.object({
      categoryId: z.string().min(1),
      title: z.string().min(1).max(200),
      description: z.string().min(1).max(2000),
      content: z.string().optional(),
      imageUrl: z.string().url().optional(),
      sources: z.string().optional(),
    });
    const {
      categoryId,
      title,
      description,
      content,
      imageUrl,
      sources,
    } = bodySchema.parse(req.body);

    const submission = await prisma.contentSubmission.create({
      data: {
        userId: req.user!.id,
        categoryId,
        title,
        description,
        content,
        imageUrl,
        sources,
      },
      select: {
        id: true,
        status: true,
        title: true,
        createdAt: true,
        category: { select: { id: true, slug: true, name: true } },
      },
    });

    res.status(201).json({ submission });
  }),
);

moderationRouter.post(
  "/submissions/:submissionId/report",
  requireAuth,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      submissionId: z.string().min(1),
    });
    const bodySchema = z.object({
      reason: z.string().min(1).max(500),
      description: z.string().max(2000).optional(),
    });

    const { submissionId } = paramsSchema.parse(req.params);
    const { reason, description } = bodySchema.parse(req.body);

    const exists = await prisma.contentSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true },
    });
    if (!exists) throw new HttpError(404, "Submission not found");

    const report = await prisma.contentReport.create({
      data: {
        reporterId: req.user!.id,
        submissionId,
        reason,
        description,
      },
      select: { id: true, status: true, reason: true, createdAt: true },
    });

    res.status(201).json({ report });
  }),
);

moderationRouter.post(
  "/lessons/:lessonId/report",
  requireAuth,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const bodySchema = z.object({
      reason: z.string().min(1).max(500),
      description: z.string().max(2000).optional(),
    });
    const { lessonId } = paramsSchema.parse(req.params);
    const { reason, description } = bodySchema.parse(req.body);

    const exists = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });
    if (!exists) throw new HttpError(404, "Lesson not found");

    const report = await prisma.contentReport.create({
      data: {
        reporterId: req.user!.id,
        lessonId,
        reason,
        description,
      },
      select: { id: true, status: true, reason: true, createdAt: true },
    });

    res.status(201).json({ report });
  }),
);

