import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/http";
import { requireAuth } from "../../middleware/auth.middleware";
import { HttpError } from "../../lib/errors";
import { contentAdminRouter } from "./content-admin.controller";
import { pollRouter } from "../quiz/poll.controller";
import * as progressService from "./chapter-progress.service";
import * as stepsService from "./chapter-steps.service";
import { RespondToStepSchema, AdvanceChapterSchema } from "./chapter.types";

let quizChapterIdColumnPromise: Promise<boolean> | null = null;

async function hasQuizChapterIdColumn() {
  if (!quizChapterIdColumnPromise) {
    quizChapterIdColumnPromise = prisma
      .$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'Quiz'
            AND column_name = 'chapterId'
        ) AS "exists"
      `
      .then((rows) => rows[0]?.exists === true)
      .catch(() => false);
  }

  return quizChapterIdColumnPromise;
}

function getPublicQuizSelect(includeChapterId: boolean, language?: string) {
  return {
    id: true,
    ...(includeChapterId ? { chapterId: true } : {}),
    type: true,
    question: true,
    options: true,
    optionImages: true,
    explanation: true,
    heartLimit: true,
    timeLimitSeconds: true,
    difficulty: true,
    tags: true,
    topicId: true,
    questionAudioUrl: true,
    isPoll: true,
    pollDescription: true,
    pollResults: true,
    totalPollVotes: true,
    translations: language
      ? {
          where: { language },
          take: 1,
          select: {
            question: true,
            options: true,
            explanation: true,
            pollDescription: true,
          },
        }
      : false,
  } as const;
}

/** Merge localized quiz copy when `translations` was loaded for a single language; strip `translations` from the payload. */
function applyQuizLanguage<
  T extends {
    question: string;
    options: unknown;
    explanation: string | null;
    translations?:
      | { question: string; options: unknown; explanation: string | null }[]
      | false
      | null;
  },
>(quiz: T): Omit<T, "translations"> {
  const list = quiz.translations;
  const tr = Array.isArray(list) && list.length > 0 ? list[0] : null;
  const { translations: _t, ...rest } = quiz;
  if (!tr) return rest;
  return {
    ...rest,
    question: tr.question,
    options: tr.options,
    explanation: tr.explanation,
  } as Omit<T, "translations">;
}

export const contentRouter = Router();
contentRouter.use(contentAdminRouter);
contentRouter.use(pollRouter);

contentRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        lessons: {
          select: {
            id: true,
            chapters: {
              select: {
                id: true,
              },
            },
          },
        },
        characterCategories: {
          select: {
            characterId: true,
          },
        },
      },
    });

    // Transform categories to include computed counts
    const categoriesWithCounts = categories.map((category) => {
      const lessonCount = category.lessons.length;
      const totalChapters = category.lessons.reduce(
        (sum, lesson) => sum + lesson.chapters.length,
        0,
      );
      const characterCount = category.characterCategories.length;

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        coverImage: category.coverImage,
        icon: category.icon,
        lessonCount,
        totalChapters,
        characterCount,
      };
    });

    res.status(200).json({ categories: categoriesWithCounts });
  }),
);

contentRouter.get(
  "/lessons",
  asyncHandler(async (req, res) => {
    const language =
      typeof req.query.language === "string" ? req.query.language : undefined;
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
    const language =
      typeof req.query.language === "string" ? req.query.language : undefined;
    const characters = await prisma.character.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
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
          : undefined,
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
        coverImage: true,
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
    const language =
      typeof req.query.language === "string" ? req.query.language : undefined;
    const quizChapterIdEnabled = await hasQuizChapterIdColumn();

    const lesson = await prisma.lesson.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        hook: true,
        coverImage: true,
        xpReward: true,
        isPremium: true,
        titleAudioUrl: true, // NEW: Audio for lesson title
        hookAudioUrl: true, // NEW: Audio for intro/hook
        contentAudioUrl: true, // NEW: Audio narration for main content
        deepDiveAudioUrl: true, // NEW: Audio for deep dive content
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
        quizzes: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: getPublicQuizSelect(quizChapterIdEnabled, language),
        },
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

    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    const translation =
      language && Array.isArray(lesson.translations)
        ? lesson.translations[0]
        : null;

    const normalized = translation
      ? {
          ...lesson,
          title: translation.title,
          description: translation.description,
          hook: translation.hook,
        }
      : lesson;

    const withQuizzes =
      language && Array.isArray(normalized.quizzes)
        ? {
            ...normalized,
            quizzes: normalized.quizzes.map((q) => ({
              ...applyQuizLanguage(q),
              chapterId: quizChapterIdEnabled ? q.chapterId ?? null : null,
            })),
          }
        : {
            ...normalized,
            quizzes: normalized.quizzes.map((q) => ({
              ...q,
              chapterId: quizChapterIdEnabled ? q.chapterId ?? null : null,
            })),
          };

    res.status(200).json({ lesson: withQuizzes });
  }),
);

contentRouter.get(
  "/lessons/:lessonId",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);
    const language =
      typeof req.query.language === "string" ? req.query.language : undefined;
    const quizChapterIdEnabled = await hasQuizChapterIdColumn();

    if (language) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          description: true,
          hook: true,
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
          quizzes: {
            where: { isActive: true },
            orderBy: { order: "asc" },
            select: getPublicQuizSelect(quizChapterIdEnabled, language),
          },
          translations: {
            where: { language },
            take: 1,
            select: {
              title: true,
              description: true,
              hook: true,
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
              quizzes: lesson.quizzes.map((q) => ({
                ...applyQuizLanguage(q),
                chapterId: quizChapterIdEnabled ? q.chapterId ?? null : null,
              })),
            }
          : {
              ...lesson,
              quizzes: lesson.quizzes.map((q) => ({
                ...applyQuizLanguage(q),
                chapterId: quizChapterIdEnabled ? q.chapterId ?? null : null,
              })),
            },
      });
      return;
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        hook: true,
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
        quizzes: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: getPublicQuizSelect(quizChapterIdEnabled),
        },
      },
    });

    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    res.status(200).json({
      lesson: {
        ...lesson,
        quizzes: lesson.quizzes.map((q) => ({
          ...q,
          chapterId: quizChapterIdEnabled ? q.chapterId ?? null : null,
        })),
      },
    });
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
    const language =
      typeof req.query.language === "string" ? req.query.language : undefined;
    const quizChapterIdEnabled = await hasQuizChapterIdColumn();

    const quizzes = await prisma.quiz.findMany({
      where: { lessonId, isActive: true },
      orderBy: { order: "asc" },
      select: getPublicQuizSelect(quizChapterIdEnabled, language),
    });

    const payload = language
      ? quizzes.map((q) => ({
          ...applyQuizLanguage(q),
          chapterId: quizChapterIdEnabled ? q.chapterId ?? null : null,
        }))
      : quizzes.map((q) => ({
          ...q,
          chapterId: quizChapterIdEnabled ? q.chapterId ?? null : null,
        }));

    res.status(200).json({ quizzes: payload });
  }),
);

contentRouter.get(
  "/characters/slug/:slug",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ slug: z.string().min(1) });
    const { slug } = paramsSchema.parse(req.params);
    const language =
      typeof req.query.language === "string" ? req.query.language : undefined;

    const character = await prisma.character.findUnique({
      where: { slug },
      include: {
        categories: {
          include: {
            category: { select: { id: true, slug: true, name: true } },
          },
        },
        lessons: {
          orderBy: { order: "asc" },
          include: {
            lesson: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
              },
            },
          },
        },
        translations: language
          ? {
              where: { language },
              take: 1,
              select: { name: true, description: true, story: true },
            }
          : undefined,
      },
    });

    if (!character)
      return res.status(404).json({ error: "Character not found" });

    const translation =
      language && Array.isArray(character.translations)
        ? character.translations[0]
        : null;

    // Flatten lessons array to match client type expectations
    const flattenedLessons = (character.lessons || []).map((cl: any) => ({
      id: cl.lesson.id,
      slug: cl.lesson.slug,
      title: cl.lesson.title,
      description: cl.lesson.description,
      order: cl.order,
    }));

    res.status(200).json({
      character: translation
        ? {
            ...character,
            lessons: flattenedLessons,
            name: translation.name,
            description: translation.description,
            story: translation.story,
          }
        : {
            ...character,
            lessons: flattenedLessons,
          },
    });
  }),
);

contentRouter.get(
  "/characters/:characterId",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ characterId: z.string().min(1) });
    const { characterId } = paramsSchema.parse(req.params);
    const language =
      typeof req.query.language === "string" ? req.query.language : undefined;

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        categories: {
          include: {
            category: { select: { id: true, slug: true, name: true } },
          },
        },
        lessons: {
          orderBy: { order: "asc" },
          include: {
            lesson: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
              },
            },
          },
        },
        translations: language
          ? {
              where: { language },
              take: 1,
              select: { name: true, description: true, story: true },
            }
          : undefined,
      },
    });

    if (!character)
      return res.status(404).json({ error: "Character not found" });

    const translation =
      language && Array.isArray(character.translations)
        ? character.translations[0]
        : null;

    // Flatten lessons array to match client type expectations
    const flattenedLessons = (character.lessons || []).map((cl: any) => ({
      id: cl.lesson.id,
      slug: cl.lesson.slug,
      title: cl.lesson.title,
      description: cl.lesson.description,
      order: cl.order,
    }));

    res.status(200).json({
      character: translation
        ? {
            ...character,
            lessons: flattenedLessons,
            name: translation.name,
            description: translation.description,
            story: translation.story,
          }
        : {
            ...character,
            lessons: flattenedLessons,
          },
    });
  }),
);

// ---------- Character Collections (Public) ----------
contentRouter.get(
  "/character-collections",
  asyncHandler(async (_req, res) => {
    const collections = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        description: string | null;
        coverImage: string | null;
        order: number;
        createdAt: Date;
        updatedAt: Date;
        characterCount: number;
      }>
    >`
      SELECT 
        cc.id,
        cc.name,
        cc.description,
        cc."coverImage",
        cc."order",
        cc."createdAt",
        cc."updatedAt",
        COUNT(cci.id)::int as "characterCount"
      FROM "CharacterCollection" cc
      LEFT JOIN "CharacterCollectionItem" cci ON cc.id = cci."collectionId"
      GROUP BY cc.id
      ORDER BY cc."order" ASC, cc."createdAt" DESC
    `;
    res.status(200).json({ collections });
  }),
);

contentRouter.get(
  "/character-collections/:collectionId",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ collectionId: z.string().min(1) });
    const { collectionId } = paramsSchema.parse(req.params);

    const collection = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        description: string | null;
        coverImage: string | null;
        order: number;
        createdAt: Date;
        updatedAt: Date;
        characters: Array<{
          id: string;
          name: string;
          slug: string;
          imageUrl: string | null;
          rarityLevel: string | null;
        }> | null;
      }>
    >`
      SELECT 
        cc.id,
        cc.name,
        cc.description,
        cc."coverImage",
        cc."order",
        cc."createdAt",
        cc."updatedAt",
        json_agg(
          json_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug,
            'imageUrl', c."imageUrl",
            'rarityLevel', c."rarityLevel"
          ) ORDER BY cci."order"
        ) FILTER (WHERE c.id IS NOT NULL) as characters
      FROM "CharacterCollection" cc
      LEFT JOIN "CharacterCollectionItem" cci ON cc.id = cci."collectionId"
      LEFT JOIN "Character" c ON cci."characterId" = c.id
      WHERE cc.id = ${collectionId}
      GROUP BY cc.id
    `;

    if (!collection || collection.length === 0) {
      return res.status(404).json({ error: "Collection not found" });
    }

    res.status(200).json({ collection: collection[0] });
  }),
);

contentRouter.get(
  "/lesson-collections",
  asyncHandler(async (_req, res) => {
    const collections = await prisma.collection.findMany({
      where: { isPublic: true },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        items: {
          orderBy: [{ order: "asc" }, { addedAt: "asc" }],
          include: {
            lesson: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                coverImage: true,
                xpReward: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      collections: collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        description: collection.description,
        coverImage: collection.items[0]?.lesson.coverImage ?? null,
        itemCount: collection.items.length,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        lessons: collection.items.map((item) => item.lesson),
      })),
    });
  }),
);

contentRouter.get(
  "/lesson-collections/:collectionId",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ collectionId: z.string().min(1) });
    const { collectionId } = paramsSchema.parse(req.params);

    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, isPublic: true },
      include: {
        items: {
          orderBy: [{ order: "asc" }, { addedAt: "asc" }],
          include: {
            lesson: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                coverImage: true,
                xpReward: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    res.status(200).json({
      collection: {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        coverImage: collection.items[0]?.lesson.coverImage ?? null,
        itemCount: collection.items.length,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        lessons: collection.items.map((item) => item.lesson),
      },
    });
  }),
);

contentRouter.get(
  "/roadmap",
  asyncHandler(async (req, res) => {
    const language =
      typeof req.query.language === "string" ? req.query.language : undefined;

    const levels = await prisma.roadmapLevel.findMany({
      where: { isPublished: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        lessons: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          include: {
            lesson: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                hook: true,
                coverImage: true,
                xpReward: true,
                isPremium: true,
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
            },
          },
        },
      },
    });

    res.status(200).json({
      levels: levels.map((level) => ({
        id: level.id,
        title: level.title,
        description: level.description,
        symbol: level.symbol,
        color: level.color,
        order: level.order,
        lessons: level.lessons.map((item) => {
          const translation =
            Array.isArray(item.lesson.translations) &&
            item.lesson.translations.length > 0
              ? item.lesson.translations[0]
              : null;
          return {
            id: item.lesson.id,
            slug: item.lesson.slug,
            title: translation?.title ?? item.lesson.title,
            description: translation?.description ?? item.lesson.description,
            hook: translation?.hook ?? item.lesson.hook,
            coverImage: item.lesson.coverImage,
            xpReward: item.lesson.xpReward,
            isPremium: item.lesson.isPremium,
            order: item.order,
          };
        }),
      })),
    });
  }),
);

// ==================== INTERACTIVE CHAPTERS (PUBLIC) ====================

// Get lesson with all chapters and steps
contentRouter.get(
  "/lessons/:lessonId/interactive",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);
    const quizChapterIdEnabled = await hasQuizChapterIdColumn();

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        chapters: {
          orderBy: { order: "asc" },
          include: {
            steps: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    if (!quizChapterIdEnabled) {
      return res.status(200).json({
        lesson: {
          ...lesson,
          chapters: lesson.chapters.map((chapter) => ({
          ...chapter,
          steps: chapter.steps.map(stepsService.serializeChapterStep),
          quizzes: [],
        })),
        },
      });
    }

    const quizzes = await prisma.quiz.findMany({
      where: { lessonId, isActive: true },
      orderBy: { order: "asc" },
      select: getPublicQuizSelect(true),
    });

    res.status(200).json({
      lesson: {
        ...lesson,
        chapters: lesson.chapters.map((chapter) => ({
          ...chapter,
          steps: chapter.steps.map(stepsService.serializeChapterStep),
          quizzes: quizzes
            .filter((quiz) => quiz.chapterId === chapter.id)
            .map((quiz) => ({ ...quiz, chapterId: quiz.chapterId ?? null })),
        })),
      },
    });
  }),
);

// Get chapter with steps
contentRouter.get(
  "/chapters/:chapterId",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ chapterId: z.string().min(1) });
    const { chapterId } = paramsSchema.parse(req.params);
    const quizChapterIdEnabled = await hasQuizChapterIdColumn();

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        steps: { orderBy: { order: "asc" } },
      },
    });

    if (!chapter) throw new HttpError(404, "Chapter not found");
    if (!quizChapterIdEnabled) {
      return res.status(200).json({
        chapter: {
          ...chapter,
          steps: chapter.steps.map(stepsService.serializeChapterStep),
          quizzes: [],
        },
      });
    }

    const quizzes = await prisma.quiz.findMany({
      where: { chapterId, isActive: true },
      orderBy: { order: "asc" },
      select: getPublicQuizSelect(true),
    });

    res.status(200).json({
      chapter: {
        ...chapter,
        steps: chapter.steps.map(stepsService.serializeChapterStep),
        quizzes: quizzes.map((quiz) => ({
          ...quiz,
          chapterId: quiz.chapterId ?? null,
        })),
      },
    });
  }),
);

// Get user's progress through lesson
contentRouter.get(
  "/lessons/:lessonId/progress",
  requireAuth,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);
    const userId = req.user!.id;

    try {
      const progressData =
        await progressService.getUserLessonProgressWithDetails(
          userId,
          lessonId,
        );

      res.status(200).json({
        success: true,
        progress: progressData,
      });
    } catch (err: any) {
      throw new HttpError(404, err.message || "Lesson not found");
    }
  }),
);

// Get user's chapter progress
contentRouter.get(
  "/chapters/:chapterId/progress",
  requireAuth,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ chapterId: z.string().min(1) });
    const { chapterId } = paramsSchema.parse(req.params);
    const userId = req.user!.id;

    const progress = await prisma.userChapterProgress.findUnique({
      where: {
        userId_chapterId: { userId, chapterId },
      },
    });

    if (!progress) {
      // Create progress if doesn't exist
      const newProgress = await progressService.getOrCreateChapterProgress(
        userId,
        chapterId,
      );
      return res.status(200).json({ success: true, progress: newProgress });
    }

    res.status(200).json({ success: true, progress });
  }),
);

// Respond to a step (poll/choice/quiz)
contentRouter.post(
  "/lessons/:lessonId/chapters/:chapterId/steps/:stepId/respond",
  requireAuth,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      lessonId: z.string().min(1),
      chapterId: z.string().min(1),
      stepId: z.string().min(1),
    });
    const { lessonId, chapterId, stepId } = paramsSchema.parse(req.params);
    const userId = req.user!.id;

    const { type, selectedOption, chosenStepId } = RespondToStepSchema.parse(
      req.body,
    );

    // Verify step exists
    const step = await prisma.chapterStep.findUnique({
      where: { id: stepId },
    });

    if (!step) throw new HttpError(404, "Step not found");

    // Verify chapter exists and belongs to lesson
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter || chapter.lessonId !== lessonId) {
      throw new HttpError(400, "Chapter does not belong to lesson");
    }

    // Record response
    const response = await stepsService.recordStepResponse(
      userId,
      stepId,
      type as "poll" | "choice",
      selectedOption,
      chosenStepId,
    );

    res.status(200).json({
      success: true,
      response,
    });
  }),
);

// Advance to next step
contentRouter.post(
  "/lessons/:lessonId/chapters/:chapterId/advance",
  requireAuth,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      lessonId: z.string().min(1),
      chapterId: z.string().min(1),
    });
    const { lessonId, chapterId } = paramsSchema.parse(req.params);
    const userId = req.user!.id;

    const { fromStepIndex } = AdvanceChapterSchema.parse(req.body);

    // Verify chapter exists and belongs to lesson
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter || chapter.lessonId !== lessonId) {
      throw new HttpError(400, "Chapter does not belong to lesson");
    }

    const updated = await progressService.advanceChapterStep(
      userId,
      chapterId,
      fromStepIndex,
    );

    res.status(200).json({
      success: true,
      progress: updated,
    });
  }),
);

// Complete chapter
contentRouter.post(
  "/lessons/:lessonId/chapters/:chapterId/complete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      lessonId: z.string().min(1),
      chapterId: z.string().min(1),
    });
    const { lessonId, chapterId } = paramsSchema.parse(req.params);
    const userId = req.user!.id;

    // Verify chapter exists and belongs to lesson
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter || chapter.lessonId !== lessonId) {
      throw new HttpError(400, "Chapter does not belong to lesson");
    }

    const { progress, completion } = await progressService.completeChapter(
      userId,
      chapterId,
    );

    // Optionally advance lesson to next chapter
    try {
      await progressService.advanceLesson(userId, lessonId);
    } catch (err) {
      // Lesson doesn't have more chapters, that's fine
    }

    res.status(200).json({
      success: true,
      progress,
      completion,
    });
  }),
);

// Get user's responses to a step
contentRouter.get(
  "/chapters/:chapterId/steps/:stepId/my-response",
  requireAuth,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      chapterId: z.string().min(1),
      stepId: z.string().min(1),
    });
    const { stepId } = paramsSchema.parse(req.params);
    const userId = req.user!.id;

    const response = await stepsService.getUserStepResponse(userId, stepId);

    res.status(200).json({
      success: true,
      response: response || null,
    });
  }),
);
