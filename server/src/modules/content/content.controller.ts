import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/http";

export const contentRouter = Router();

contentRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        coverImage: true,
        icon: true,
      },
    });

    res.status(200).json({ categories });
  }),
);

contentRouter.get(
  "/lessons",
  asyncHandler(async (req, res) => {
    const language = typeof req.query.language === "string" ? req.query.language : undefined;
    const lessons = await prisma.lesson.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        hook: true,
        coverImage: true,
        xpReward: true,
        isPremium: true,
        category: { select: { id: true, name: true, slug: true } },
        translations: language
          ? {
              where: { language },
              take: 1,
              select: {
                title: true,
                description: true,
                hook: true,
              },
            }
          : false,
      },
    });

    res.status(200).json({ lessons });
  }),
);

contentRouter.get(
  "/characters",
  asyncHandler(async (req, res) => {
    const language = typeof req.query.language === "string" ? req.query.language : undefined;
    const characters = await prisma.character.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        story: true,
        imageUrl: true,
        rarityLevel: true,
        category: { select: { id: true, name: true, slug: true } },
        translations: language
          ? {
              where: { language },
              take: 1,
              select: {
                name: true,
                description: true,
                story: true,
              },
            }
          : false,
      },
    });

    res.status(200).json({ characters });
  }),
);

contentRouter.get(
  "/topics",
  asyncHandler(async (_req, res) => {
    const topics = await prisma.topic.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
      },
    });
    res.status(200).json({ topics });
  }),
);

contentRouter.get(
  "/lessons/slug/:slug",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ slug: z.string().min(1) });
    const { slug } = paramsSchema.parse(req.params);
    const language = typeof req.query.language === "string" ? req.query.language : undefined;

    const lesson = await prisma.lesson.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        hook: true,
        content: true,
        coverImage: true,
        xpReward: true,
        isPremium: true,
        category: { select: { id: true, slug: true, name: true } },
        topic: { select: { id: true, slug: true, name: true } },
        chapters: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true, content: true, mediaType: true, mediaUrl: true },
        },
        quizzes: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: {
            id: true,
            question: true,
            options: true,
            explanation: true,
            heartLimit: true,
            timeLimitSeconds: true,
            difficulty: true,
            tags: true,
            topicId: true,
          },
        },
        translations: language
          ? {
              where: { language },
              take: 1,
              select: { title: true, description: true, hook: true, content: true },
            }
          : false,
      },
    });

    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    const translation = language && Array.isArray(lesson.translations)
      ? lesson.translations[0]
      : null;

    const normalized = translation
      ? {
          ...lesson,
          title: translation.title,
          description: translation.description,
          hook: translation.hook,
          content: translation.content,
        }
      : lesson;

    res.status(200).json({ lesson: normalized });
  }),
);

contentRouter.get(
  "/lessons/:lessonId",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);
    const language = typeof req.query.language === "string" ? req.query.language : undefined;

    if (language) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          hook: true,
          content: true,
          coverImage: true,
          xpReward: true,
          isPremium: true,
          category: { select: { id: true, slug: true, name: true } },
          topic: { select: { id: true, slug: true, name: true } },
          chapters: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              mediaType: true,
              mediaUrl: true,
            },
          },
          translations: {
            where: { language },
            take: 1,
            select: {
              title: true,
              description: true,
              hook: true,
              content: true,
            },
          },
        },
      });

      if (!lesson) return res.status(404).json({ error: "Lesson not found" });

      const translation = Array.isArray(lesson.translations)
        ? lesson.translations[0]
        : null;
      res.status(200).json({
        lesson: translation
          ? {
              ...lesson,
              title: translation.title,
              description: translation.description,
              hook: translation.hook,
              content: translation.content,
            }
          : lesson,
      });
      return;
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        hook: true,
        content: true,
        coverImage: true,
        xpReward: true,
        isPremium: true,
        category: { select: { id: true, slug: true, name: true } },
        topic: { select: { id: true, slug: true, name: true } },
        chapters: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true, mediaType: true, mediaUrl: true },
        },
      },
    });

    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    res.status(200).json({ lesson });
  }),
);

contentRouter.get(
  "/lessons/:lessonId/chapters",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);

    const chapters = await prisma.chapter.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        order: true,
        content: true,
        mediaType: true,
        mediaUrl: true,
        feedbackQuestion: true,
      },
    });

    res.status(200).json({ chapters });
  }),
);

contentRouter.get(
  "/lessons/:lessonId/quizzes",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);

    const quizzes = await prisma.quiz.findMany({
      where: { lessonId, isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        question: true,
        options: true,
        explanation: true,
        heartLimit: true,
        timeLimitSeconds: true,
        difficulty: true,
        tags: true,
        topicId: true,
        // Do NOT return correctOption to the client by default.
      },
    });

    res.status(200).json({ quizzes });
  }),
);

contentRouter.get(
  "/characters/slug/:slug",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ slug: z.string().min(1) });
    const { slug } = paramsSchema.parse(req.params);
    const language = typeof req.query.language === "string" ? req.query.language : undefined;

    const character = await prisma.character.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        story: true,
        imageUrl: true,
        inventionImage: true,
        xpThreshold: true,
        rarityLevel: true,
        category: { select: { id: true, slug: true, name: true } },
        unlockLesson: { select: { id: true, slug: true } },
        collectedBy: false,
        translations: language
          ? {
              where: { language },
              take: 1,
              select: { name: true, description: true, story: true },
            }
          : false,
      },
    });

    if (!character) return res.status(404).json({ error: "Character not found" });

    const translation = language && Array.isArray(character.translations)
      ? character.translations[0]
      : null;

    res.status(200).json({
      character: translation
        ? {
            ...character,
            name: translation.name,
            description: translation.description,
            story: translation.story,
          }
        : character,
    });
  }),
);

