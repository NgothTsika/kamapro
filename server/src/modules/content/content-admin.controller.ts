import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/http";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { HttpError } from "../../lib/errors";
import * as chapterStepsService from "./chapter-steps.service";
import {
  validateStepContent,
  CreateChapterStepSchema,
  UpdateChapterStepSchema,
} from "./chapter.types";

const adminRoles = requireRole("ADMIN", "MODERATOR");
let quizChapterIdColumnPromise: Promise<boolean> | null = null;
const tableColumnPromiseCache = new Map<string, Promise<boolean>>();

async function hasTableColumn(tableName: string, columnName: string) {
  const key = `${tableName}.${columnName}`;
  const cached = tableColumnPromiseCache.get(key);
  if (cached) return cached;

  const promise = prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${tableName}
          AND column_name = ${columnName}
      ) AS "exists"
    `
    .then((rows) => rows[0]?.exists === true)
    .catch(() => false);

  tableColumnPromiseCache.set(key, promise);
  return promise;
}

async function hasQuizChapterIdColumn() {
  if (!quizChapterIdColumnPromise) {
    quizChapterIdColumnPromise = prisma.$queryRaw<Array<{ exists: boolean }>>`
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

function getAdminQuizSelect(includeChapterId: boolean): Prisma.QuizSelect {
  return {
    id: true,
    ...(includeChapterId ? { chapterId: true } : {}),
    lessonId: true,
    question: true,
    type: true,
    options: true,
    optionImages: true,
    correctOption: true,
    explanation: true,
    order: true,
    heartLimit: true,
    timeLimitSeconds: true,
    difficulty: true,
    isActive: true,
    tags: true,
    topicId: true,
    questionAudioUrl: true,
    isPoll: true,
    pollDescription: true,
    pollResults: true,
    totalPollVotes: true,
    createdAt: true,
    updatedAt: true,
    translations: {
      orderBy: [{ language: "asc" }, { createdAt: "desc" }],
    },
  };
}

function jsonChanges(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

const adminQuizTypeSchema = z.enum([
  "true_false",
  "multiple_choice",
  "image_choice",
  "poll",
]);

type AdminQuizType = z.infer<typeof adminQuizTypeSchema>;

function inferAdminQuizType(input: {
  type?: AdminQuizType;
  isPoll?: boolean;
  options?: string[];
  optionImages?: string[] | null;
}): AdminQuizType {
  if (input.isPoll || input.type === "poll") return "poll";
  if (input.type) return input.type;
  if (
    Array.isArray(input.optionImages) &&
    input.optionImages.some((image) => image.trim().length > 0)
  ) {
    return "image_choice";
  }

  const [first, second] = input.options ?? [];
  if (
    input.options?.length === 2 &&
    first?.trim().toLowerCase() === "true" &&
    second?.trim().toLowerCase() === "false"
  ) {
    return "true_false";
  }

  return "multiple_choice";
}

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "item";
}

async function uniqueLessonSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  let candidate = slugify(base) || "lesson";
  let n = 0;
  for (;;) {
    const existing = await prisma.lesson.findUnique({
      where: { slug: candidate },
    });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
    candidate = `${slugify(base) || "lesson"}-${n}`;
  }
}

async function uniqueCategorySlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  let candidate = slugify(base) || "category";
  let n = 0;
  for (;;) {
    const existing = await prisma.category.findUnique({
      where: { slug: candidate },
    });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
    candidate = `${slugify(base) || "category"}-${n}`;
  }
}

async function uniqueTopicSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  let candidate = slugify(base) || "topic";
  let n = 0;
  for (;;) {
    const existing = await prisma.topic.findUnique({
      where: { slug: candidate },
    });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
    candidate = `${slugify(base) || "topic"}-${n}`;
  }
}

async function uniqueCharacterSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  let candidate = slugify(base) || "character";
  let n = 0;
  for (;;) {
    const existing = await prisma.character.findUnique({
      where: { slug: candidate },
    });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
    candidate = `${slugify(base) || "character"}-${n}`;
  }
}

export const contentAdminRouter = Router();

// ---------- Categories ----------
contentAdminRouter.get(
  "/admin/categories",
  requireAuth,
  adminRoles,
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    res.status(200).json({ categories });
  }),
);

contentAdminRouter.post(
  "/admin/categories",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const bodySchema = z.object({
      name: z.string().min(1).max(200),
      slug: z.string().min(1).max(200).optional(),
      description: z.string().max(5000).optional().nullable(),
      coverImage: z.string().url().optional().nullable().or(z.literal("")),
      icon: z.string().max(500).optional().nullable(),
      order: z.number().int().optional(),
    });
    const body = bodySchema.parse(req.body);
    const slug = body.slug?.trim() || (await uniqueCategorySlug(body.name));

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) throw new HttpError(409, "Slug already in use");

    const category = await prisma.category.create({
      data: {
        name: body.name.trim(),
        slug,
        description: body.description ?? undefined,
        coverImage: body.coverImage || undefined,
        icon: body.icon ?? undefined,
        order: body.order ?? 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_category",
        entityType: "category",
        entityId: category.id,
        changes: { name: category.name, slug: category.slug },
      },
    });

    res.status(201).json({ category });
  }),
);

contentAdminRouter.patch(
  "/admin/categories/:categoryId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ categoryId: z.string().min(1) });
    const { categoryId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      name: z.string().min(1).max(200).optional(),
      slug: z.string().min(1).max(200).optional(),
      description: z.string().max(5000).optional().nullable(),
      coverImage: z.string().url().optional().nullable().or(z.literal("")),
      icon: z.string().max(500).optional().nullable(),
      order: z.number().int().optional(),
    });
    const body = bodySchema.parse(req.body);

    const found = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!found) throw new HttpError(404, "Category not found");

    let slug = body.slug?.trim();
    if (slug && slug !== found.slug) {
      const clash = await prisma.category.findUnique({ where: { slug } });
      if (clash) throw new HttpError(409, "Slug already in use");
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: body.name?.trim() ?? undefined,
        slug: slug ?? undefined,
        description:
          body.description === undefined ? undefined : body.description,
        coverImage:
          body.coverImage === undefined ? undefined : body.coverImage || null,
        icon: body.icon === undefined ? undefined : body.icon,
        order: body.order ?? undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_category",
        entityType: "category",
        entityId: categoryId,
        changes: jsonChanges(body),
      },
    });

    res.status(200).json({ category });
  }),
);

contentAdminRouter.delete(
  "/admin/categories/:categoryId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ categoryId: z.string().min(1) });
    const { categoryId } = paramsSchema.parse(req.params);

    const lessonCount = await prisma.lesson.count({ where: { categoryId } });
    if (lessonCount > 0) {
      throw new HttpError(
        400,
        "Category has lessons; reassign or delete lessons first",
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_category",
        entityType: "category",
        entityId: categoryId,
        changes: {},
      },
    });

    res.status(204).send();
  }),
);

// ---------- Topics ----------
contentAdminRouter.get(
  "/admin/topics",
  requireAuth,
  adminRoles,
  asyncHandler(async (_req, res) => {
    const topics = await prisma.topic.findMany({
      orderBy: [{ name: "asc" }],
    });
    res.status(200).json({ topics });
  }),
);

contentAdminRouter.post(
  "/admin/topics",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const bodySchema = z.object({
      name: z.string().min(1).max(200),
      slug: z.string().min(1).max(200).optional(),
      description: z.string().max(5000).optional().nullable(),
      coverImage: z.string().optional().nullable(),
      parentId: z.string().optional().nullable(),
    });
    const body = bodySchema.parse(req.body);
    const slug = body.slug?.trim() || (await uniqueTopicSlug(body.name));

    const existing = await prisma.topic.findUnique({ where: { slug } });
    if (existing) throw new HttpError(409, "Slug already in use");

    const topic = await prisma.topic.create({
      data: {
        name: body.name.trim(),
        slug,
        description: body.description ?? undefined,
        coverImage: body.coverImage ?? undefined,
        parentId: body.parentId ?? undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_topic",
        entityType: "topic",
        entityId: topic.id,
        changes: { name: topic.name, slug: topic.slug },
      },
    });

    res.status(201).json({ topic });
  }),
);

contentAdminRouter.patch(
  "/admin/topics/:topicId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ topicId: z.string().min(1) });
    const { topicId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      name: z.string().min(1).max(200).optional(),
      slug: z.string().min(1).max(200).optional(),
      description: z.string().max(5000).optional().nullable(),
      coverImage: z.string().optional().nullable(),
      parentId: z.string().optional().nullable(),
    });
    const body = bodySchema.parse(req.body);

    const found = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!found) throw new HttpError(404, "Topic not found");

    let slug = body.slug?.trim();
    if (slug && slug !== found.slug) {
      const clash = await prisma.topic.findUnique({ where: { slug } });
      if (clash) throw new HttpError(409, "Slug already in use");
    }

    const topic = await prisma.topic.update({
      where: { id: topicId },
      data: {
        name: body.name?.trim() ?? undefined,
        slug: slug ?? undefined,
        description:
          body.description === undefined ? undefined : body.description,
        coverImage: body.coverImage === undefined ? undefined : body.coverImage,
        parentId: body.parentId === undefined ? undefined : body.parentId,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_topic",
        entityType: "topic",
        entityId: topicId,
        changes: jsonChanges(body),
      },
    });

    res.status(200).json({ topic });
  }),
);

contentAdminRouter.delete(
  "/admin/topics/:topicId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ topicId: z.string().min(1) });
    const { topicId } = paramsSchema.parse(req.params);

    const children = await prisma.topic.count({ where: { parentId: topicId } });
    if (children > 0) throw new HttpError(400, "Topic has child topics");

    const lessonCount = await prisma.lesson.count({ where: { topicId } });
    if (lessonCount > 0) throw new HttpError(400, "Topic has lessons assigned");

    const quizCount = await prisma.quiz.count({ where: { topicId } });
    if (quizCount > 0)
      throw new HttpError(400, "Topic is linked to quizzes; reassign first");

    const matchCount = await prisma.gameMatch.count({ where: { topicId } });
    if (matchCount > 0)
      throw new HttpError(400, "Topic is used in game matches");

    await prisma.topic.delete({ where: { id: topicId } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_topic",
        entityType: "topic",
        entityId: topicId,
        changes: {},
      },
    });

    res.status(204).send();
  }),
);

// ---------- Lessons (admin list + CRUD) ----------
contentAdminRouter.get(
  "/admin/lessons",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const querySchema = z.object({
      published: z.enum(["all", "true", "false"]).optional(),
    });
    const { published = "all" } = querySchema.parse(req.query);

    const where =
      published === "all" ? {} : { published: published === "true" };

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        category: { select: { id: true, name: true, slug: true } },
        topic: { select: { id: true, name: true, slug: true } },
        _count: { select: { chapters: true, quizzes: true } },
      },
    });

    res.status(200).json({ lessons });
  }),
);

contentAdminRouter.get(
  "/admin/lessons/:lessonId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);
    const quizChapterIdEnabled = await hasQuizChapterIdColumn();
    const [hasChapterIntroText, hasChapterIntroAudioUrl] = await Promise.all([
      hasTableColumn("Chapter", "introText"),
      hasTableColumn("Chapter", "introAudioUrl"),
    ]);

    const lessonSelect = {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      description: true,
      hook: true,
      coverImage: true,
      xpReward: true,
      isPremium: true,
      published: true,
      order: true,
      categoryId: true,
      topicId: true,
      category: { select: { id: true, name: true, slug: true } },
      topic: { select: { id: true, name: true, slug: true } },
      relatedCharacters: {
        select: {
          character: { select: { id: true, name: true, slug: true } },
        },
      },
      chapters: {
        orderBy: { order: "asc" as const },
        select: {
          id: true,
          lessonId: true,
          title: true,
          coverImage: true,
          mediaType: true,
          mediaUrl: true,
          feedbackQuestion: true,
          order: true,
          createdAt: true,
          updatedAt: true,
          ...(hasChapterIntroText ? { introText: true } : {}),
          ...(hasChapterIntroAudioUrl ? { introAudioUrl: true } : {}),
        },
      },
      translations: {
        orderBy: [{ language: "asc" as const }, { createdAt: "desc" as const }],
      },
    } satisfies Prisma.LessonSelect;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: lessonSelect,
    });

    if (!lesson) throw new HttpError(404, "Lesson not found");
    const quizzes = await prisma.quiz.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
      select: getAdminQuizSelect(quizChapterIdEnabled),
    });
    res.status(200).json({
      lesson: {
        ...lesson,
        descriptionPlainText: chapterStepsService.getStepPlainText(
          lesson.description ?? "",
        ),
        hookPlainText: chapterStepsService.getStepPlainText(lesson.hook ?? ""),
        chapters: lesson.chapters.map((chapter) => ({
          ...chapter,
          content: "",
          introText:
            hasChapterIntroText && "introText" in chapter
              ? (chapter.introText ?? null)
              : null,
          introAudioUrl:
            hasChapterIntroAudioUrl && "introAudioUrl" in chapter
              ? (chapter.introAudioUrl ?? null)
              : null,
        })),
        quizzes: quizzes.map((quiz) => ({
          ...quiz,
          chapterId: quizChapterIdEnabled ? (quiz.chapterId ?? null) : null,
        })),
      },
    });
  }),
);

contentAdminRouter.post(
  "/admin/lessons",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const bodySchema = z.object({
      title: z.string().min(1).max(300),
      subtitle: z.string().min(1).max(300).optional().default(""),
      slug: z.string().min(1).max(200).optional(),
      description: z.string().max(10000).optional().nullable(),
      hook: z.string().max(2000).optional().nullable(),
      coverImage: z.string().url().optional().nullable().or(z.literal("")),
      xpReward: z.number().int().min(0).optional(),
      isPremium: z.boolean().optional(),
      published: z.boolean().optional(),
      order: z.number().int().optional(),
      categoryId: z.string().optional().nullable(),
      topicId: z.string().optional().nullable(),
      characterId: z.string().optional().nullable(),
    });
    const body = bodySchema.parse(req.body);
    const slug = body.slug?.trim() || (await uniqueLessonSlug(body.title));

    const clash = await prisma.lesson.findUnique({ where: { slug } });
    if (clash) throw new HttpError(409, "Slug already in use");

    const createData: any = {
      title: body.title.trim(),
      subtitle: body.subtitle.trim() || body.title.trim(),
      slug,
      xpReward: body.xpReward ?? 10,
      isPremium: body.isPremium ?? false,
      published: body.published ?? false,
      order: body.order ?? 0,
    };

    // Only include optional fields if they are provided and not null
    if (body.description !== undefined && body.description !== null) {
      createData.description = body.description;
    }
    if (body.hook !== undefined && body.hook !== null) {
      createData.hook = body.hook;
    }
    if (
      body.coverImage !== undefined &&
      body.coverImage !== null &&
      body.coverImage !== ""
    ) {
      createData.coverImage = body.coverImage;
    }
    if (body.categoryId !== undefined && body.categoryId !== null) {
      createData.categoryId = body.categoryId;
    }
    if (body.topicId !== undefined && body.topicId !== null) {
      createData.topicId = body.topicId;
    }
    const lesson = await prisma.lesson.create({
      data: createData,
    });

    if (body.characterId) {
      await prisma.characterLesson.create({
        data: { lessonId: lesson.id, characterId: body.characterId, order: 0 },
      });
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_lesson",
        entityType: "lesson",
        entityId: lesson.id,
        changes: { title: lesson.title, slug: lesson.slug },
      },
    });

    res.status(201).json({ lesson });
  }),
);

contentAdminRouter.patch(
  "/admin/lessons/:lessonId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      title: z.string().min(1).max(300).optional(),
      subtitle: z.string().min(1).max(300).optional(),
      slug: z.string().min(1).max(200).optional(),
      description: z.string().max(10000).optional().nullable(),
      hook: z.string().max(2000).optional().nullable(),
      coverImage: z.string().url().optional().nullable().or(z.literal("")),
      xpReward: z.number().int().min(0).optional(),
      isPremium: z.boolean().optional(),
      published: z.boolean().optional(),
      order: z.number().int().optional(),
      categoryId: z.string().optional().nullable(),
      topicId: z.string().optional().nullable(),
      characterId: z.string().optional().nullable(), // NEW: assign lesson to character
    });
    const body = bodySchema.parse(req.body);

    const found = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!found) throw new HttpError(404, "Lesson not found");

    let slug = body.slug?.trim();
    if (slug && slug !== found.slug) {
      const clash = await prisma.lesson.findUnique({ where: { slug } });
      if (clash) throw new HttpError(409, "Slug already in use");
    } else if (!slug && body.title && body.title !== found.title) {
      slug = await uniqueLessonSlug(body.title, lessonId);
    }

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: body.title?.trim() ?? undefined,
        subtitle: body.subtitle?.trim() ?? undefined,
        slug: slug ?? undefined,
        description:
          body.description === undefined ? undefined : body.description,
        hook: body.hook === undefined ? undefined : body.hook,
        coverImage:
          body.coverImage === undefined ? undefined : body.coverImage || null,
        xpReward: body.xpReward ?? undefined,
        isPremium: body.isPremium ?? undefined,
        published: body.published ?? undefined,
        order: body.order ?? undefined,
        categoryId: body.categoryId === undefined ? undefined : body.categoryId,
        topicId: body.topicId === undefined ? undefined : body.topicId,
      },
    });

    // NEW: Handle character assignment if provided
    if (body.characterId !== undefined) {
      // Remove existing character-lesson relationship for this lesson
      await prisma.characterLesson.deleteMany({
        where: { lessonId },
      });

      // If characterId is provided and not null, create new relationship
      if (body.characterId) {
        const characterExists = await prisma.character.findUnique({
          where: { id: body.characterId },
        });
        if (!characterExists) {
          throw new HttpError(404, "Character not found");
        }

        await prisma.characterLesson.create({
          data: {
            lessonId,
            characterId: body.characterId,
            order: 0,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_lesson",
        entityType: "lesson",
        entityId: lessonId,
        changes: jsonChanges(body),
      },
    });

    res.status(200).json({ lesson });
  }),
);

contentAdminRouter.delete(
  "/admin/lessons/:lessonId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);

    await prisma.lesson.delete({ where: { id: lessonId } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_lesson",
        entityType: "lesson",
        entityId: lessonId,
        changes: {},
      },
    });

    res.status(204).send();
  }),
);

// ---------- Chapters ----------
contentAdminRouter.post(
  "/admin/lessons/:lessonId/chapters",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      title: z.string().min(1).max(300),
      coverImage: z.string().url().optional().nullable().or(z.literal("")),
      mediaType: z.string().max(50).optional().nullable(),
      mediaUrl: z.string().url().optional().nullable().or(z.literal("")),
      feedbackQuestion: z.string().max(2000).optional().nullable(),
      introText: z.string().max(5000).optional().nullable(),
      introAudioUrl: z.string().url().optional().nullable(),
      order: z.number().int().optional(),
    });
    const body = bodySchema.parse(req.body);

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new HttpError(404, "Lesson not found");

    const chapter = await prisma.chapter.create({
      data: {
        lessonId,
        title: body.title.trim(),
        coverImage: body.coverImage || undefined,
        mediaType: body.mediaType ?? undefined,
        mediaUrl: body.mediaUrl || undefined,
        feedbackQuestion: body.feedbackQuestion ?? undefined,
        introText: body.introText ?? undefined,
        introAudioUrl: body.introAudioUrl ?? undefined,
        order: body.order ?? 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_chapter",
        entityType: "chapter",
        entityId: chapter.id,
        changes: { lessonId, title: chapter.title },
      },
    });

    res.status(201).json({ chapter });
  }),
);

contentAdminRouter.patch(
  "/admin/chapters/:chapterId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ chapterId: z.string().min(1) });
    const { chapterId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      title: z.string().min(1).max(300).optional(),
      coverImage: z.string().url().optional().nullable().or(z.literal("")),
      mediaType: z.string().max(50).optional().nullable(),
      mediaUrl: z.string().url().optional().nullable().or(z.literal("")),
      feedbackQuestion: z.string().max(2000).optional().nullable(),
      introText: z.string().max(5000).optional().nullable(),
      introAudioUrl: z.string().url().optional().nullable(),
      order: z.number().int().optional(),
    });
    const body = bodySchema.parse(req.body);

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        title: body.title?.trim() ?? undefined,
        coverImage:
          body.coverImage === undefined ? undefined : body.coverImage || null,
        mediaType: body.mediaType === undefined ? undefined : body.mediaType,
        mediaUrl:
          body.mediaUrl === undefined ? undefined : body.mediaUrl || null,
        feedbackQuestion:
          body.feedbackQuestion === undefined
            ? undefined
            : body.feedbackQuestion,
        introText: body.introText === undefined ? undefined : body.introText,
        introAudioUrl:
          body.introAudioUrl === undefined ? undefined : body.introAudioUrl,
        order: body.order ?? undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_chapter",
        entityType: "chapter",
        entityId: chapterId,
        changes: jsonChanges(body),
      },
    });

    res.status(200).json({ chapter });
  }),
);

contentAdminRouter.delete(
  "/admin/chapters/:chapterId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ chapterId: z.string().min(1) });
    const { chapterId } = paramsSchema.parse(req.params);

    await prisma.chapter.delete({ where: { id: chapterId } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_chapter",
        entityType: "chapter",
        entityId: chapterId,
        changes: {},
      },
    });

    res.status(204).send();
  }),
);

// ---------- Chapter Steps (Admin) ----------

// Create step
contentAdminRouter.post(
  "/admin/lessons/:lessonId/chapters/:chapterId/steps",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      lessonId: z.string().min(1),
      chapterId: z.string().min(1),
    });
    const { chapterId } = paramsSchema.parse(req.params);

    const body = CreateChapterStepSchema.parse(req.body);

    // Validate step content matches type
    if (!validateStepContent(body.type, body.content)) {
      throw new HttpError(
        400,
        `Invalid content structure for step type: ${body.type}`,
      );
    }

    const step = await chapterStepsService.createChapterStep(chapterId, body);

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_chapter_step",
        entityType: "chapter_step",
        entityId: step.id,
        changes: { chapterId, type: step.type, order: step.order },
      },
    });

    res.status(201).json({ step: chapterStepsService.serializeChapterStep(step) });
  }),
);

// Get step
contentAdminRouter.get(
  "/admin/lessons/:lessonId/chapters/:chapterId/steps/:stepId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      lessonId: z.string().min(1),
      chapterId: z.string().min(1),
      stepId: z.string().min(1),
    });
    const { stepId } = paramsSchema.parse(req.params);

    const step = await prisma.chapterStep.findUnique({
      where: { id: stepId },
      select: await chapterStepsService.getChapterStepSelect(),
    });

    if (!step) throw new HttpError(404, "Step not found");

    res.status(200).json({ step: chapterStepsService.serializeChapterStep(step) });
  }),
);

// Update step
contentAdminRouter.patch(
  "/admin/lessons/:lessonId/chapters/:chapterId/steps/:stepId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      lessonId: z.string().min(1),
      chapterId: z.string().min(1),
      stepId: z.string().min(1),
    });
    const { stepId } = paramsSchema.parse(req.params);

    const body = UpdateChapterStepSchema.parse(req.body);

    // Validate content if provided
    if (body.content || body.type) {
      const existingStep = await prisma.chapterStep.findUnique({
        where: { id: stepId },
        select: await chapterStepsService.getChapterStepSelect(),
      });
      if (!existingStep) throw new HttpError(404, "Step not found");

      const typeToValidate = body.type || existingStep.type;
      const contentToValidate = body.content || existingStep.content;

      if (!validateStepContent(typeToValidate, contentToValidate)) {
        throw new HttpError(
          400,
          `Invalid content structure for step type: ${typeToValidate}`,
        );
      }
    }

    const step = await chapterStepsService.updateChapterStep(stepId, body);

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_chapter_step",
        entityType: "chapter_step",
        entityId: step.id,
        changes: jsonChanges(body),
      },
    });

    res.status(200).json({ step: chapterStepsService.serializeChapterStep(step) });
  }),
);

// Delete step
contentAdminRouter.delete(
  "/admin/lessons/:lessonId/chapters/:chapterId/steps/:stepId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      lessonId: z.string().min(1),
      chapterId: z.string().min(1),
      stepId: z.string().min(1),
    });
    const { stepId } = paramsSchema.parse(req.params);

    await chapterStepsService.deleteChapterStep(stepId);

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_chapter_step",
        entityType: "chapter_step",
        entityId: stepId,
        changes: {},
      },
    });

    res.status(200).json({ success: true, message: "Step deleted" });
  }),
);

// Reorder steps
contentAdminRouter.post(
  "/admin/lessons/:lessonId/chapters/:chapterId/reorder-steps",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      lessonId: z.string().min(1),
      chapterId: z.string().min(1),
    });
    const { chapterId } = paramsSchema.parse(req.params);

    const bodySchema = z.object({
      stepIds: z.array(z.string()),
    });
    const { stepIds } = bodySchema.parse(req.body);

    const steps = await chapterStepsService.reorderChapterSteps(
      chapterId,
      stepIds,
    );

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "reorder_chapter_steps",
        entityType: "chapter",
        entityId: chapterId,
        changes: { stepCount: steps.length },
      },
    });

    res.status(200).json({
      steps: steps.map(chapterStepsService.serializeChapterStep),
    });
  }),
);

// ---------- Quizzes ----------
contentAdminRouter.post(
  "/admin/lessons/:lessonId/quizzes",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      question: z.string().min(1),
      chapterId: z.string().min(1).optional().nullable(),
      type: adminQuizTypeSchema.optional(),
      options: z.array(z.string()).min(2),
      optionImages: z.array(z.string()).optional().nullable(),
      correctOption: z.number().int().min(0).optional().nullable(),
      explanation: z.string().optional().nullable(),
      order: z.number().int().optional(),
      heartLimit: z.number().int().min(0).optional(),
      timeLimitSeconds: z.number().int().positive().optional().nullable(),
      difficulty: z.string().max(50).optional().nullable(),
      isActive: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      topicId: z.string().optional().nullable(),
      questionAudioUrl: z.string().url().optional().nullable(), // NEW
      isPoll: z.boolean().optional(), // NEW
      pollDescription: z.string().optional().nullable(), // NEW
    });
    const body = bodySchema.parse(req.body);
    const quizChapterIdEnabled = await hasQuizChapterIdColumn();
    if (body.chapterId && !quizChapterIdEnabled) {
      throw new HttpError(
        500,
        "Database is missing chapter quiz support. Run the latest Prisma migration for Quiz.chapterId.",
      );
    }

    const requestedChapterId = quizChapterIdEnabled
      ? (body.chapterId ?? null)
      : null;
    const isPoll = body.isPoll ?? body.type === "poll";
    const quizType = inferAdminQuizType({
      type: body.type,
      isPoll,
      options: body.options,
      optionImages: body.optionImages ?? null,
    });
    const optionImages =
      body.optionImages?.map((image) => image.trim()).filter(Boolean) ?? null;

    // Validate poll questions should not have correctOption
    if (
      isPoll &&
      body.correctOption !== null &&
      body.correctOption !== undefined
    ) {
      throw new HttpError(
        400,
        "Poll questions should not have a correct answer",
      );
    }

    // Validate regular quizzes must have correctOption
    if (
      !isPoll &&
      (body.correctOption === null || body.correctOption === undefined)
    ) {
      throw new HttpError(
        400,
        "Regular quiz questions must have a correct answer",
      );
    }

    if (
      body.correctOption !== null &&
      body.correctOption !== undefined &&
      body.correctOption >= body.options.length
    ) {
      throw new HttpError(400, "correctOption index out of range");
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new HttpError(404, "Lesson not found");

    if (requestedChapterId) {
      const chapter = await prisma.chapter.findFirst({
        where: { id: requestedChapterId, lessonId },
        select: { id: true },
      });
      if (!chapter) {
        throw new HttpError(
          400,
          "Selected chapter does not belong to this lesson",
        );
      }
    }

    const quiz = await prisma.quiz.create({
      data: {
        lessonId,
        ...(quizChapterIdEnabled ? { chapterId: requestedChapterId } : {}),
        question: body.question.trim(),
        type: quizType,
        options: body.options,
        optionImages: optionImages === null ? Prisma.JsonNull : optionImages,
        correctOption: isPoll ? null : body.correctOption,
        explanation: isPoll ? null : (body.explanation ?? undefined),
        order: body.order ?? 0,
        heartLimit: isPoll ? undefined : (body.heartLimit ?? 4),
        timeLimitSeconds: body.timeLimitSeconds ?? undefined,
        difficulty: isPoll ? null : (body.difficulty ?? undefined),
        isActive: body.isActive ?? true,
        tags: body.tags ?? [],
        topicId: body.topicId ?? undefined,
        questionAudioUrl: body.questionAudioUrl ?? undefined, // NEW
        isPoll, // NEW
        pollDescription: body.pollDescription ?? undefined, // NEW
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_quiz",
        entityType: "quiz",
        entityId: quiz.id,
        changes: jsonChanges({
          lessonId,
          chapterId: requestedChapterId,
          question: quiz.question,
          type: quiz.type,
          isPoll,
        }),
      },
    });

    res.status(201).json({ quiz });
  }),
);

// GET /content/admin/lessons/:lessonId/quizzes
// Get all quizzes for a specific lesson (admin)
contentAdminRouter.get(
  "/admin/lessons/:lessonId/quizzes",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });
    if (!lesson) throw new HttpError(404, "Lesson not found");
    const quizChapterIdEnabled = await hasQuizChapterIdColumn();

    const quizzes = await prisma.quiz.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
      select: getAdminQuizSelect(quizChapterIdEnabled),
    });

    // Helper to safely parse JSON fields
    const safeJsonArray = (value: unknown): string[] => {
      if (Array.isArray(value)) return value as string[];
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const safeJsonObject = (value: unknown): Record<string, number> | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === "object" && !Array.isArray(value))
        return value as Record<string, number>;
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return typeof parsed === "object" ? parsed : null;
        } catch {
          return null;
        }
      }
      return null;
    };

    // Transform quizzes to ensure proper JSON serialization
    const transformedQuizzes = quizzes.map((quiz) => ({
      id: quiz.id,
      lessonId: quiz.lessonId,
      chapterId: quizChapterIdEnabled ? (quiz.chapterId ?? null) : null,
      question: quiz.question,
      type: quiz.type,
      options: safeJsonArray(quiz.options),
      optionImages: Array.isArray(quiz.optionImages)
        ? quiz.optionImages
        : safeJsonArray(quiz.optionImages),
      correctOption: quiz.correctOption,
      explanation: quiz.explanation,
      order: quiz.order,
      heartLimit: quiz.heartLimit,
      timeLimitSeconds: quiz.timeLimitSeconds,
      difficulty: quiz.difficulty,
      isActive: quiz.isActive,
      tags: quiz.tags,
      topicId: quiz.topicId,
      questionAudioUrl: quiz.questionAudioUrl,
      isPoll: quiz.isPoll,
      pollDescription: quiz.pollDescription,
      pollResults: safeJsonObject(quiz.pollResults),
      totalPollVotes: quiz.totalPollVotes,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
      translations: quiz.translations,
    }));

    res.status(200).json({ quizzes: transformedQuizzes });
  }),
);

contentAdminRouter.patch(
  "/admin/quizzes/:quizId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ quizId: z.string().min(1) });
    const { quizId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      question: z.string().min(1).optional(),
      chapterId: z.string().min(1).optional().nullable(),
      type: adminQuizTypeSchema.optional(),
      options: z.array(z.string()).min(2).optional(),
      optionImages: z.array(z.string()).optional().nullable(),
      correctOption: z.number().int().min(0).optional().nullable(),
      explanation: z.string().optional().nullable(),
      order: z.number().int().optional(),
      heartLimit: z.number().int().min(0).optional(),
      timeLimitSeconds: z.number().int().positive().optional().nullable(),
      difficulty: z.string().max(50).optional().nullable(),
      isActive: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      topicId: z.string().optional().nullable(),
      questionAudioUrl: z.string().url().optional().nullable(), // NEW
      isPoll: z.boolean().optional(), // NEW
      pollDescription: z.string().optional().nullable(), // NEW
    });
    const body = bodySchema.parse(req.body);
    const quizChapterIdEnabled = await hasQuizChapterIdColumn();
    if (body.chapterId && !quizChapterIdEnabled) {
      throw new HttpError(
        500,
        "Database is missing chapter quiz support. Run the latest Prisma migration for Quiz.chapterId.",
      );
    }

    const requestedChapterId =
      quizChapterIdEnabled && body.chapterId !== undefined
        ? body.chapterId
        : undefined;

    const existing = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!existing) throw new HttpError(404, "Quiz not found");

    if (requestedChapterId) {
      const chapter = await prisma.chapter.findFirst({
        where: { id: requestedChapterId, lessonId: existing.lessonId },
        select: { id: true },
      });
      if (!chapter) {
        throw new HttpError(
          400,
          "Selected chapter does not belong to this lesson",
        );
      }
    }

    const options = body.options ?? (existing.options as unknown as string[]);
    const isPoll =
      body.isPoll ?? (body.type === "poll" ? true : existing.isPoll);
    const isSwitchingToPoll =
      isPoll && (body.isPoll !== undefined || body.type === "poll");
    const correctOption =
      body.correctOption !== undefined
        ? body.correctOption
        : isSwitchingToPoll
          ? null
          : existing.correctOption;
    const quizType = inferAdminQuizType({
      type: body.type,
      isPoll,
      options,
      optionImages:
        body.optionImages === undefined
          ? ((existing.optionImages as unknown as string[] | null) ?? null)
          : body.optionImages,
    });
    const optionImages =
      body.optionImages === undefined
        ? undefined
        : (body.optionImages?.map((image) => image.trim()).filter(Boolean) ??
          null);

    // Validate poll questions should not have correctOption
    if (isPoll && correctOption !== null && correctOption !== undefined) {
      throw new HttpError(
        400,
        "Poll questions should not have a correct answer",
      );
    }

    // Validate regular quizzes must have correctOption
    if (!isPoll && (correctOption === null || correctOption === undefined)) {
      throw new HttpError(
        400,
        "Regular quiz questions must have a correct answer",
      );
    }

    if (
      correctOption !== null &&
      correctOption !== undefined &&
      correctOption >= options.length
    ) {
      throw new HttpError(400, "correctOption index out of range");
    }

    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        question: body.question?.trim() ?? undefined,
        ...(quizChapterIdEnabled && requestedChapterId !== undefined
          ? { chapterId: requestedChapterId }
          : {}),
        type:
          body.type === undefined && body.isPoll === undefined
            ? undefined
            : quizType,
        options: body.options ?? undefined,
        optionImages:
          optionImages === undefined
            ? undefined
            : optionImages === null
              ? Prisma.JsonNull
              : optionImages,
        correctOption: isPoll ? null : (body.correctOption ?? undefined),
        explanation: isPoll
          ? null
          : body.explanation === undefined
            ? undefined
            : body.explanation,
        order: body.order ?? undefined,
        heartLimit: isPoll ? undefined : (body.heartLimit ?? undefined),
        timeLimitSeconds:
          body.timeLimitSeconds === undefined
            ? undefined
            : body.timeLimitSeconds,
        difficulty: isPoll
          ? null
          : body.difficulty === undefined
            ? undefined
            : body.difficulty,
        isActive: body.isActive ?? undefined,
        tags: body.tags ?? undefined,
        topicId: body.topicId === undefined ? undefined : body.topicId,
        questionAudioUrl:
          body.questionAudioUrl === undefined
            ? undefined
            : body.questionAudioUrl, // NEW
        isPoll: body.isPoll ?? undefined, // NEW
        pollDescription:
          body.pollDescription === undefined ? undefined : body.pollDescription, // NEW
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_quiz",
        entityType: "quiz",
        entityId: quizId,
        changes: jsonChanges(body),
      },
    });

    res.status(200).json({ quiz });
  }),
);

contentAdminRouter.delete(
  "/admin/quizzes/:quizId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ quizId: z.string().min(1) });
    const { quizId } = paramsSchema.parse(req.params);

    await prisma.quiz.delete({ where: { id: quizId } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_quiz",
        entityType: "quiz",
        entityId: quizId,
        changes: {},
      },
    });

    res.status(204).send();
  }),
);

// ---------- Quiz translations ----------
contentAdminRouter.get(
  "/admin/quizzes/:quizId/translations",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ quizId: z.string().min(1) });
    const { quizId } = paramsSchema.parse(req.params);

    const translations = await prisma.quizTranslation.findMany({
      where: { quizId },
      orderBy: [{ language: "asc" }, { createdAt: "desc" }],
    });

    res.status(200).json({ translations });
  }),
);

contentAdminRouter.post(
  "/admin/quizzes/:quizId/translations",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ quizId: z.string().min(1) });
    const { quizId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      language: z.string().min(2).max(10),
      question: z.string().min(1),
      options: z.array(z.string()).min(2),
      explanation: z.string().optional().nullable(),
      pollDescription: z.string().optional().nullable(), // NEW
    });
    const body = bodySchema.parse(req.body);

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, options: true, correctOption: true, isPoll: true },
    });
    if (!quiz) throw new HttpError(404, "Quiz not found");

    const baseOptions = quiz.options as unknown as string[];
    if (body.options.length !== baseOptions.length) {
      throw new HttpError(
        400,
        `Translated options must have the same length as the base quiz (${baseOptions.length})`,
      );
    }
    if (
      !quiz.isPoll &&
      quiz.correctOption !== null &&
      quiz.correctOption >= body.options.length
    ) {
      throw new HttpError(400, "Base quiz correctOption index is invalid");
    }

    const existing = await prisma.quizTranslation.findFirst({
      where: { quizId, language: body.language },
      select: { id: true },
    });
    if (existing)
      throw new HttpError(409, "Translation for this language already exists");

    const translation = await prisma.quizTranslation.create({
      data: {
        quizId,
        language: body.language,
        question: body.question.trim(),
        options: body.options,
        explanation: quiz.isPoll ? null : (body.explanation ?? undefined),
        pollDescription: body.pollDescription ?? undefined, // NEW
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_quiz_translation",
        entityType: "quiz_translation",
        entityId: translation.id,
        changes: jsonChanges({ quizId, language: translation.language }),
      },
    });

    res.status(201).json({ translation });
  }),
);

contentAdminRouter.patch(
  "/admin/quiz-translations/:translationId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ translationId: z.string().min(1) });
    const { translationId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      language: z.string().min(2).max(10).optional(),
      question: z.string().min(1).optional(),
      options: z.array(z.string()).min(2).optional(),
      explanation: z.string().optional().nullable(),
      pollDescription: z.string().optional().nullable(), // NEW
    });
    const body = bodySchema.parse(req.body);

    const existing = await prisma.quizTranslation.findUnique({
      where: { id: translationId },
      include: {
        quiz: {
          select: {
            id: true,
            options: true,
            correctOption: true,
            isPoll: true,
          },
        },
      },
    });
    if (!existing) throw new HttpError(404, "Quiz translation not found");

    const baseOptions = existing.quiz.options as unknown as string[];
    const nextOptions =
      body.options ?? (existing.options as unknown as string[]);
    if (nextOptions.length !== baseOptions.length) {
      throw new HttpError(
        400,
        `Translated options must have the same length as the base quiz (${baseOptions.length})`,
      );
    }

    const language = body.language?.trim();
    if (language && language !== existing.language) {
      const clash = await prisma.quizTranslation.findFirst({
        where: { quizId: existing.quizId, language },
        select: { id: true },
      });
      if (clash)
        throw new HttpError(
          409,
          "Translation for this language already exists",
        );
    }

    const translation = await prisma.quizTranslation.update({
      where: { id: translationId },
      data: {
        language: language ?? undefined,
        question: body.question?.trim() ?? undefined,
        options: body.options ?? undefined,
        explanation: existing.quiz.isPoll
          ? null
          : body.explanation === undefined
            ? undefined
            : body.explanation,
        pollDescription:
          body.pollDescription === undefined ? undefined : body.pollDescription, // NEW
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_quiz_translation",
        entityType: "quiz_translation",
        entityId: translationId,
        changes: jsonChanges(body),
      },
    });

    res.status(200).json({ translation });
  }),
);

contentAdminRouter.delete(
  "/admin/quiz-translations/:translationId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ translationId: z.string().min(1) });
    const { translationId } = paramsSchema.parse(req.params);

    await prisma.quizTranslation.delete({ where: { id: translationId } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_quiz_translation",
        entityType: "quiz_translation",
        entityId: translationId,
        changes: {},
      },
    });

    res.status(204).send();
  }),
);

// ---------- Lesson translations ----------
contentAdminRouter.get(
  "/admin/lessons/:lessonId/translations",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);

    const translations = await prisma.lessonTranslation.findMany({
      where: { lessonId },
      orderBy: [{ language: "asc" }, { createdAt: "desc" }],
    });

    res.status(200).json({ translations });
  }),
);

contentAdminRouter.post(
  "/admin/lessons/:lessonId/translations",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ lessonId: z.string().min(1) });
    const { lessonId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      language: z.string().min(2).max(10),
      title: z.string().min(1).max(300),
      description: z.string().max(10000).optional().nullable(),
      content: z.string().min(1),
      hook: z.string().max(2000).optional().nullable(),
      deepDiveContent: z.string().optional().nullable(),
    });
    const body = bodySchema.parse(req.body);

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });
    if (!lesson) throw new HttpError(404, "Lesson not found");

    const existing = await prisma.lessonTranslation.findFirst({
      where: {
        lessonId,
        language: body.language,
      },
      select: { id: true },
    });
    if (existing) {
      throw new HttpError(409, "Translation for this language already exists");
    }

    const translation = await prisma.lessonTranslation.create({
      data: {
        lessonId,
        language: body.language,
        title: body.title,
        description: body.description ?? undefined,
        hook: body.hook ?? undefined,
        deepDiveContent: body.deepDiveContent ?? undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_lesson_translation",
        entityType: "lesson_translation",
        entityId: translation.id,
        changes: jsonChanges({
          lessonId,
          language: translation.language,
        }),
      },
    });

    res.status(201).json({ translation });
  }),
);

contentAdminRouter.patch(
  "/admin/translations/:translationId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ translationId: z.string().min(1) });
    const { translationId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      language: z.string().min(2).max(10).optional(),
      title: z.string().min(1).max(300).optional(),
      description: z.string().max(10000).optional().nullable(),
      content: z.string().min(1).optional(),
      hook: z.string().max(2000).optional().nullable(),
      deepDiveContent: z.string().optional().nullable(),
    });
    const body = bodySchema.parse(req.body);

    const existing = await prisma.lessonTranslation.findUnique({
      where: { id: translationId },
      select: { id: true, lessonId: true, language: true },
    });
    if (!existing) throw new HttpError(404, "Translation not found");

    const language = body.language?.trim();
    if (language && language !== existing.language) {
      const languageClash = await prisma.lessonTranslation.findFirst({
        where: { lessonId: existing.lessonId, language },
        select: { id: true },
      });
      if (languageClash) {
        throw new HttpError(
          409,
          "Translation for this language already exists",
        );
      }
    }

    const translation = await prisma.lessonTranslation.update({
      where: { id: translationId },
      data: {
        language: language ?? undefined,
        title: body.title ?? undefined,
        description:
          body.description === undefined ? undefined : body.description,
        hook: body.hook === undefined ? undefined : body.hook,
        deepDiveContent:
          body.deepDiveContent === undefined ? undefined : body.deepDiveContent,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_lesson_translation",
        entityType: "lesson_translation",
        entityId: translationId,
        changes: jsonChanges(body),
      },
    });

    res.status(200).json({ translation });
  }),
);

contentAdminRouter.delete(
  "/admin/translations/:translationId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ translationId: z.string().min(1) });
    const { translationId } = paramsSchema.parse(req.params);

    await prisma.lessonTranslation.delete({ where: { id: translationId } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_lesson_translation",
        entityType: "lesson_translation",
        entityId: translationId,
        changes: {},
      },
    });

    res.status(204).send();
  }),
);

// ---------- Characters ----------
contentAdminRouter.get(
  "/admin/characters",
  requireAuth,
  adminRoles,
  asyncHandler(async (_req, res) => {
    const characters = await prisma.character.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        lessons: {
          include: {
            lesson: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });
    res.status(200).json({ characters });
  }),
);

contentAdminRouter.get(
  "/admin/characters/:characterId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ characterId: z.string().min(1) });
    const { characterId } = paramsSchema.parse(req.params);

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        lessons: {
          include: {
            lesson: { select: { id: true, title: true, slug: true } },
          },
        },
        translations: { orderBy: [{ language: "asc" }, { createdAt: "desc" }] },
      },
    });

    if (!character) throw new HttpError(404, "Character not found");
    res.status(200).json({ character });
  }),
);

contentAdminRouter.post(
  "/admin/characters",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const bodySchema = z.object({
      name: z.string().min(1).max(200),
      slug: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(10000),
      story: z.string().max(50000).optional().nullable(),
      imageUrl: z.string().url().optional().nullable().or(z.literal("")),
      inventionImage: z.string().url().optional().nullable().or(z.literal("")),
      xpThreshold: z.number().int().optional().nullable(),
      rarityLevel: z.string().max(50).optional().nullable(),
      categoryIds: z.array(z.string()).optional().default([]),
    });
    const body = bodySchema.parse(req.body);
    const slug = body.slug?.trim() || (await uniqueCharacterSlug(body.name));

    const clash = await prisma.character.findUnique({ where: { slug } });
    if (clash) throw new HttpError(409, "Slug already in use");

    const character = await prisma.character.create({
      data: {
        name: body.name.trim(),
        slug,
        description: body.description,
        story: body.story ?? undefined,
        imageUrl: body.imageUrl || undefined,
        inventionImage: body.inventionImage || undefined,
        xpThreshold: body.xpThreshold ?? undefined,
        rarityLevel: body.rarityLevel ?? undefined,
        // Create character-category relationships
        categories: {
          create: body.categoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
      },
      include: {
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        lessons: {
          include: {
            lesson: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_character",
        entityType: "character",
        entityId: character.id,
        changes: { name: character.name, slug: character.slug },
      },
    });

    res.status(201).json({ character });
  }),
);

contentAdminRouter.patch(
  "/admin/characters/:characterId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ characterId: z.string().min(1) });
    const { characterId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      name: z.string().min(1).max(200).optional(),
      slug: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(10000).optional(),
      story: z.string().max(50000).optional().nullable(),
      imageUrl: z.string().url().optional().nullable().or(z.literal("")),
      inventionImage: z.string().url().optional().nullable().or(z.literal("")),
      xpThreshold: z.number().int().optional().nullable(),
      rarityLevel: z.string().max(50).optional().nullable(),
      categoryIds: z.array(z.string()).optional(),
    });
    const body = bodySchema.parse(req.body);

    const found = await prisma.character.findUnique({
      where: { id: characterId },
    });
    if (!found) throw new HttpError(404, "Character not found");

    let slug = body.slug?.trim();
    if (slug && slug !== found.slug) {
      const clash = await prisma.character.findUnique({ where: { slug } });
      if (clash) throw new HttpError(409, "Slug already in use");
    }

    // If categoryIds is provided, update the categories
    if (body.categoryIds !== undefined) {
      // Delete existing category relationships
      await prisma.characterCategory.deleteMany({ where: { characterId } });
      // Create new ones
      if (body.categoryIds.length > 0) {
        await prisma.characterCategory.createMany({
          data: body.categoryIds.map((categoryId) => ({
            characterId,
            categoryId,
          })),
        });
      }
    }

    const character = await prisma.character.update({
      where: { id: characterId },
      data: {
        name: body.name?.trim() ?? undefined,
        slug: slug ?? undefined,
        description: body.description ?? undefined,
        story: body.story === undefined ? undefined : body.story,
        imageUrl:
          body.imageUrl === undefined ? undefined : body.imageUrl || null,
        inventionImage:
          body.inventionImage === undefined
            ? undefined
            : body.inventionImage || null,
        xpThreshold:
          body.xpThreshold === undefined ? undefined : body.xpThreshold,
        rarityLevel:
          body.rarityLevel === undefined ? undefined : body.rarityLevel,
      },
      include: {
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        lessons: {
          include: {
            lesson: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_character",
        entityType: "character",
        entityId: characterId,
        changes: jsonChanges(body),
      },
    });

    res.status(200).json({ character });
  }),
);

contentAdminRouter.delete(
  "/admin/characters/:characterId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ characterId: z.string().min(1) });
    const { characterId } = paramsSchema.parse(req.params);

    await prisma.character.delete({ where: { id: characterId } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_character",
        entityType: "character",
        entityId: characterId,
        changes: {},
      },
    });

    res.status(204).send();
  }),
);

// ---------- Character translations ----------
contentAdminRouter.get(
  "/admin/characters/:characterId/translations",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ characterId: z.string().min(1) });
    const { characterId } = paramsSchema.parse(req.params);

    const translations = await prisma.characterTranslation.findMany({
      where: { characterId },
      orderBy: [{ language: "asc" }, { createdAt: "desc" }],
    });

    res.status(200).json({ translations });
  }),
);

contentAdminRouter.post(
  "/admin/characters/:characterId/translations",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ characterId: z.string().min(1) });
    const { characterId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      language: z.string().min(2).max(10),
      name: z.string().min(1).max(200),
      description: z.string().min(1).max(10000),
      story: z.string().max(50000).optional().nullable(),
    });
    const body = bodySchema.parse(req.body);

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { id: true },
    });
    if (!character) throw new HttpError(404, "Character not found");

    const existing = await prisma.characterTranslation.findFirst({
      where: { characterId, language: body.language },
      select: { id: true },
    });
    if (existing)
      throw new HttpError(409, "Translation for this language already exists");

    const translation = await prisma.characterTranslation.create({
      data: {
        characterId,
        language: body.language,
        name: body.name.trim(),
        description: body.description,
        story: body.story ?? undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_character_translation",
        entityType: "character_translation",
        entityId: translation.id,
        changes: jsonChanges({ characterId, language: translation.language }),
      },
    });

    res.status(201).json({ translation });
  }),
);

contentAdminRouter.patch(
  "/admin/character-translations/:translationId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ translationId: z.string().min(1) });
    const { translationId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      language: z.string().min(2).max(10).optional(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(10000).optional(),
      story: z.string().max(50000).optional().nullable(),
    });
    const body = bodySchema.parse(req.body);

    const existing = await prisma.characterTranslation.findUnique({
      where: { id: translationId },
      select: { id: true, characterId: true, language: true },
    });
    if (!existing) throw new HttpError(404, "Character translation not found");

    const language = body.language?.trim();
    if (language && language !== existing.language) {
      const clash = await prisma.characterTranslation.findFirst({
        where: { characterId: existing.characterId, language },
        select: { id: true },
      });
      if (clash)
        throw new HttpError(
          409,
          "Translation for this language already exists",
        );
    }

    const translation = await prisma.characterTranslation.update({
      where: { id: translationId },
      data: {
        language: language ?? undefined,
        name: body.name?.trim() ?? undefined,
        description: body.description ?? undefined,
        story: body.story === undefined ? undefined : body.story,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_character_translation",
        entityType: "character_translation",
        entityId: translationId,
        changes: jsonChanges(body),
      },
    });

    res.status(200).json({ translation });
  }),
);

contentAdminRouter.delete(
  "/admin/character-translations/:translationId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ translationId: z.string().min(1) });
    const { translationId } = paramsSchema.parse(req.params);

    await prisma.characterTranslation.delete({ where: { id: translationId } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_character_translation",
        entityType: "character_translation",
        entityId: translationId,
        changes: {},
      },
    });

    res.status(204).send();
  }),
);

// ---------- Character Lessons (Admin) ----------
contentAdminRouter.get(
  "/admin/characters/:characterId/lessons",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ characterId: z.string().min(1) });
    const { characterId } = paramsSchema.parse(req.params);

    const lessons = await prisma.characterLesson.findMany({
      where: { characterId },
      orderBy: { order: "asc" },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    res.status(200).json({ lessons });
  }),
);

contentAdminRouter.post(
  "/admin/characters/:characterId/lessons",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ characterId: z.string().min(1) });
    const { characterId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      lessonId: z.string().min(1),
      order: z.number().int().optional(),
    });
    const body = bodySchema.parse(req.body);

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { id: true },
    });
    if (!character) throw new HttpError(404, "Character not found");

    const lesson = await prisma.lesson.findUnique({
      where: { id: body.lessonId },
      select: { id: true },
    });
    if (!lesson) throw new HttpError(404, "Lesson not found");

    // Check if lesson is already assigned to a character
    const existing = await prisma.characterLesson.findUnique({
      where: { lessonId: body.lessonId },
    });
    if (existing)
      throw new HttpError(
        409,
        "Lesson is already assigned to another character",
      );

    // Get the next order if not provided
    let order = body.order ?? 0;
    if (order === 0) {
      const maxOrder = await prisma.characterLesson.findFirst({
        where: { characterId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (maxOrder?.order ?? -1) + 1;
    }

    const characterLesson = await prisma.characterLesson.create({
      data: {
        characterId,
        lessonId: body.lessonId,
        order,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "assign_lesson_to_character",
        entityType: "character_lesson",
        entityId: characterLesson.id,
        changes: { lessonId: body.lessonId, order },
      },
    });

    res.status(201).json({ lesson: characterLesson });
  }),
);

contentAdminRouter.put(
  "/admin/characters/:characterId/lessons/:characterLessonId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      characterId: z.string().min(1),
      characterLessonId: z.string().min(1),
    });
    const { characterId, characterLessonId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      order: z.number().int(),
    });
    const body = bodySchema.parse(req.body);

    const characterLesson = await prisma.characterLesson.findUnique({
      where: { id: characterLessonId },
    });
    if (!characterLesson || characterLesson.characterId !== characterId) {
      throw new HttpError(404, "Character lesson not found");
    }

    const updated = await prisma.characterLesson.update({
      where: { id: characterLessonId },
      data: { order: body.order },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_character_lesson_order",
        entityType: "character_lesson",
        entityId: characterLessonId,
        changes: { order: body.order },
      },
    });

    res.status(200).json({ lesson: updated });
  }),
);

contentAdminRouter.delete(
  "/admin/characters/:characterId/lessons/:characterLessonId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      characterId: z.string().min(1),
      characterLessonId: z.string().min(1),
    });
    const { characterId, characterLessonId } = paramsSchema.parse(req.params);

    const characterLesson = await prisma.characterLesson.findUnique({
      where: { id: characterLessonId },
    });
    if (!characterLesson || characterLesson.characterId !== characterId) {
      throw new HttpError(404, "Character lesson not found");
    }

    await prisma.characterLesson.delete({ where: { id: characterLessonId } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "remove_lesson_from_character",
        entityType: "character_lesson",
        entityId: characterLessonId,
        changes: {},
      },
    });

    res.status(204).send();
  }),
);

// ---------- Character Collections (Admin) ----------
contentAdminRouter.get(
  "/admin/character-collections",
  requireAuth,
  adminRoles,
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

contentAdminRouter.get(
  "/admin/character-collections/:collectionId",
  requireAuth,
  adminRoles,
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
      throw new HttpError(404, "Collection not found");
    }

    res.status(200).json({ collection: collection[0] });
  }),
);

contentAdminRouter.post(
  "/admin/character-collections",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const bodySchema = z.object({
      name: z.string().min(1).max(200),
      description: z.string().max(1000).optional().nullable(),
      coverImage: z.string().max(10000000).optional().nullable(), // Allow base64 data URIs and URLs
      order: z.number().int().min(0).optional(),
      characterIds: z.array(z.string()).default([]),
    });
    const body = bodySchema.parse(req.body);

    // Verify all character IDs exist
    if (body.characterIds.length > 0) {
      const existingCharacters = await prisma.character.findMany({
        where: { id: { in: body.characterIds } },
        select: { id: true },
      });
      if (existingCharacters.length !== body.characterIds.length) {
        throw new HttpError(400, "Some character IDs do not exist");
      }
    }

    const collection = await prisma.characterCollection.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim(),
        coverImage: body.coverImage || undefined,
        order: body.order ?? 0,
      },
    });

    // Add characters to collection if provided
    if (body.characterIds.length > 0) {
      await prisma.characterCollectionItem.createMany({
        data: body.characterIds.map((characterId, index) => ({
          collectionId: collection.id,
          characterId,
          order: index,
        })),
      });
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_character_collection",
        entityType: "character_collection",
        entityId: collection.id,
        changes: jsonChanges({
          name: body.name,
          description: body.description,
          coverImage: body.coverImage || null,
          order: body.order ?? 0,
          characterCount: body.characterIds.length,
        }),
      },
    });

    res.status(201).json({ collection });
  }),
);

contentAdminRouter.patch(
  "/admin/character-collections/:collectionId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ collectionId: z.string().min(1) });
    const { collectionId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).optional().nullable(),
      coverImage: z.string().max(10000000).optional().nullable(), // Allow base64 data URIs and URLs
      order: z.number().int().min(0).optional(),
      characterIds: z.array(z.string()).optional(),
    });
    const body = bodySchema.parse(req.body);

    // Verify collection exists
    const existing = await prisma.characterCollection.findUnique({
      where: { id: collectionId },
    });
    if (!existing) {
      throw new HttpError(404, "Collection not found");
    }

    // Verify all character IDs exist if provided
    if (body.characterIds && body.characterIds.length > 0) {
      const existingCharacters = await prisma.character.findMany({
        where: { id: { in: body.characterIds } },
        select: { id: true },
      });
      if (existingCharacters.length !== body.characterIds.length) {
        throw new HttpError(400, "Some character IDs do not exist");
      }
    }

    const collection = await prisma.characterCollection.update({
      where: { id: collectionId },
      data: {
        name: body.name?.trim(),
        description:
          body.description === undefined ? undefined : body.description?.trim(),
        coverImage:
          body.coverImage === undefined
            ? undefined
            : body.coverImage || undefined,
        order: body.order ?? undefined,
      },
    });

    // Update characters if provided
    if (body.characterIds !== undefined) {
      // Remove existing items
      await prisma.characterCollectionItem.deleteMany({
        where: { collectionId },
      });

      // Add new items
      if (body.characterIds.length > 0) {
        await prisma.characterCollectionItem.createMany({
          data: body.characterIds.map((characterId, index) => ({
            collectionId,
            characterId,
            order: index,
          })),
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_character_collection",
        entityType: "character_collection",
        entityId: collectionId,
        changes: jsonChanges({
          name: body.name,
          description: body.description,
          coverImage:
            body.coverImage === undefined ? undefined : body.coverImage || null,
          order: body.order,
          characterCount: body.characterIds?.length || 0,
        }),
      },
    });

    res.status(200).json({ collection });
  }),
);

contentAdminRouter.delete(
  "/admin/character-collections/:collectionId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ collectionId: z.string().min(1) });
    const { collectionId } = paramsSchema.parse(req.params);

    // Verify collection exists
    const existing = await prisma.characterCollection.findUnique({
      where: { id: collectionId },
    });
    if (!existing) {
      throw new HttpError(404, "Collection not found");
    }

    // Delete all collection items first (cascade)
    await prisma.characterCollectionItem.deleteMany({
      where: { collectionId },
    });

    // Delete the collection
    await prisma.characterCollection.delete({
      where: { id: collectionId },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_character_collection",
        entityType: "character_collection",
        entityId: collectionId,
        changes: jsonChanges({
          name: existing.name,
          description: existing.description,
        }),
      },
    });

    res.status(204).send();
  }),
);

contentAdminRouter.get(
  "/admin/lesson-collections",
  requireAuth,
  adminRoles,
  asyncHandler(async (_req, res) => {
    const collections = await prisma.collection.findMany({
      orderBy: [{ updatedAt: "desc" }],
      include: {
        items: {
          orderBy: [{ order: "asc" }, { addedAt: "asc" }],
          include: {
            lesson: {
              select: {
                coverImage: true,
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
        isPublic: collection.isPublic,
        itemCount: collection.items.length,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      })),
    });
  }),
);

contentAdminRouter.get(
  "/admin/lesson-collections/:collectionId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ collectionId: z.string().min(1) });
    const { collectionId } = paramsSchema.parse(req.params);

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        items: {
          orderBy: [{ order: "asc" }, { addedAt: "asc" }],
          include: {
            lesson: {
              select: {
                id: true,
                slug: true,
                title: true,
                coverImage: true,
                xpReward: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      throw new HttpError(404, "Collection not found");
    }

    res.status(200).json({
      collection: {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        coverImage: collection.items[0]?.lesson.coverImage ?? null,
        isPublic: collection.isPublic,
        itemCount: collection.items.length,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        lessons: collection.items.map((item) => item.lesson),
      },
    });
  }),
);

contentAdminRouter.post(
  "/admin/lesson-collections",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const bodySchema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional().nullable(),
      coverImage: z.string().max(10000000).optional().nullable(),
      isPublic: z.boolean().optional(),
      lessonIds: z.array(z.string()).default([]),
    });
    const body = bodySchema.parse(req.body);

    if (body.lessonIds.length > 0) {
      const existingLessons = await prisma.lesson.findMany({
        where: { id: { in: body.lessonIds } },
        select: { id: true },
      });

      if (existingLessons.length !== body.lessonIds.length) {
        throw new HttpError(400, "Some lesson IDs do not exist");
      }
    }

    const collection = await prisma.collection.create({
      data: {
        userId: req.user!.id,
        title: body.title.trim(),
        description: body.description?.trim(),
        isPublic: body.isPublic ?? true,
      },
    });

    if (body.lessonIds.length > 0) {
      await prisma.collectionItem.createMany({
        data: body.lessonIds.map((lessonId, index) => ({
          collectionId: collection.id,
          lessonId,
          order: index,
        })),
      });
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_lesson_collection",
        entityType: "lesson_collection",
        entityId: collection.id,
        changes: jsonChanges({
          title: body.title,
          description: body.description,
          isPublic: body.isPublic ?? true,
          lessonCount: body.lessonIds.length,
        }),
      },
    });

    res.status(201).json({
      collection: {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        coverImage: null,
        isPublic: collection.isPublic,
        itemCount: body.lessonIds.length,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
    });
  }),
);

contentAdminRouter.patch(
  "/admin/lesson-collections/:collectionId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ collectionId: z.string().min(1) });
    const { collectionId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).optional().nullable(),
      coverImage: z.string().max(10000000).optional().nullable(),
      isPublic: z.boolean().optional(),
      lessonIds: z.array(z.string()).optional(),
    });
    const body = bodySchema.parse(req.body);

    const existing = await prisma.collection.findUnique({
      where: { id: collectionId },
    });
    if (!existing) {
      throw new HttpError(404, "Collection not found");
    }

    if (body.lessonIds && body.lessonIds.length > 0) {
      const existingLessons = await prisma.lesson.findMany({
        where: { id: { in: body.lessonIds } },
        select: { id: true },
      });
      if (existingLessons.length !== body.lessonIds.length) {
        throw new HttpError(400, "Some lesson IDs do not exist");
      }
    }

    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        title: body.title?.trim(),
        description:
          body.description === undefined ? undefined : body.description?.trim(),
        isPublic: body.isPublic ?? undefined,
      },
    });

    if (body.lessonIds !== undefined) {
      await prisma.collectionItem.deleteMany({ where: { collectionId } });

      if (body.lessonIds.length > 0) {
        await prisma.collectionItem.createMany({
          data: body.lessonIds.map((lessonId, index) => ({
            collectionId,
            lessonId,
            order: index,
          })),
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_lesson_collection",
        entityType: "lesson_collection",
        entityId: collectionId,
        changes: jsonChanges({
          title: body.title,
          description: body.description,
          isPublic: body.isPublic,
          lessonCount: body.lessonIds?.length,
        }),
      },
    });

    const itemCount =
      body.lessonIds?.length ??
      (await prisma.collectionItem.count({ where: { collectionId } }));

    res.status(200).json({
      collection: {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        coverImage: null,
        isPublic: collection.isPublic,
        itemCount,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
    });
  }),
);

contentAdminRouter.delete(
  "/admin/lesson-collections/:collectionId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ collectionId: z.string().min(1) });
    const { collectionId } = paramsSchema.parse(req.params);

    const existing = await prisma.collection.findUnique({
      where: { id: collectionId },
    });
    if (!existing) {
      throw new HttpError(404, "Collection not found");
    }

    await prisma.collectionItem.deleteMany({ where: { collectionId } });
    await prisma.collection.delete({ where: { id: collectionId } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_lesson_collection",
        entityType: "lesson_collection",
        entityId: collectionId,
        changes: jsonChanges({ title: existing.title }),
      },
    });

    res.status(204).send();
  }),
);

// ---------- Roadmap Levels ----------
contentAdminRouter.get(
  "/admin/roadmap-levels",
  requireAuth,
  adminRoles,
  asyncHandler(async (_req, res) => {
    const levels = await prisma.roadmapLevel.findMany({
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
                coverImage: true,
                xpReward: true,
                published: true,
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
        isPublished: level.isPublished,
        lessonCount: level.lessons.length,
        createdAt: level.createdAt,
        updatedAt: level.updatedAt,
        lessons: level.lessons.map((item) => ({
          ...item.lesson,
          roadmapItemId: item.id,
          order: item.order,
        })),
      })),
    });
  }),
);

contentAdminRouter.post(
  "/admin/roadmap-levels",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const bodySchema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional().nullable(),
      symbol: z.string().max(80).optional().nullable(),
      color: z.string().max(40).optional().nullable(),
      order: z.number().int().optional(),
      isPublished: z.boolean().optional(),
      lessonIds: z.array(z.string().min(1)).default([]),
    });
    const body = bodySchema.parse(req.body);

    if (body.lessonIds.length > 0) {
      const lessons = await prisma.lesson.findMany({
        where: { id: { in: body.lessonIds } },
        select: { id: true },
      });
      if (lessons.length !== new Set(body.lessonIds).size) {
        throw new HttpError(400, "Some lesson IDs do not exist");
      }
    }

    const level = await prisma.roadmapLevel.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim(),
        symbol: body.symbol?.trim(),
        color: body.color?.trim(),
        order: body.order ?? 0,
        isPublished: body.isPublished ?? true,
      },
    });

    const lessonIds = [...new Set(body.lessonIds)];
    if (lessonIds.length > 0) {
      await prisma.roadmapLevelLesson.createMany({
        data: lessonIds.map((lessonId, index) => ({
          levelId: level.id,
          lessonId,
          order: index,
        })),
      });
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "create_roadmap_level",
        entityType: "roadmap_level",
        entityId: level.id,
        changes: jsonChanges({ title: level.title, lessonCount: lessonIds.length }),
      },
    });

    res.status(201).json({ level: { ...level, lessonCount: lessonIds.length } });
  }),
);

contentAdminRouter.patch(
  "/admin/roadmap-levels/:levelId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ levelId: z.string().min(1) });
    const { levelId } = paramsSchema.parse(req.params);
    const bodySchema = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).optional().nullable(),
      symbol: z.string().max(80).optional().nullable(),
      color: z.string().max(40).optional().nullable(),
      order: z.number().int().optional(),
      isPublished: z.boolean().optional(),
      lessonIds: z.array(z.string().min(1)).optional(),
    });
    const body = bodySchema.parse(req.body);

    const existing = await prisma.roadmapLevel.findUnique({
      where: { id: levelId },
    });
    if (!existing) throw new HttpError(404, "Roadmap level not found");

    const lessonIds =
      body.lessonIds !== undefined ? [...new Set(body.lessonIds)] : undefined;
    if (lessonIds && lessonIds.length > 0) {
      const lessons = await prisma.lesson.findMany({
        where: { id: { in: lessonIds } },
        select: { id: true },
      });
      if (lessons.length !== lessonIds.length) {
        throw new HttpError(400, "Some lesson IDs do not exist");
      }
    }

    const level = await prisma.roadmapLevel.update({
      where: { id: levelId },
      data: {
        title: body.title?.trim(),
        description:
          body.description === undefined ? undefined : body.description?.trim(),
        symbol: body.symbol === undefined ? undefined : body.symbol?.trim(),
        color: body.color === undefined ? undefined : body.color?.trim(),
        order: body.order,
        isPublished: body.isPublished,
      },
    });

    if (lessonIds !== undefined) {
      await prisma.roadmapLevelLesson.deleteMany({ where: { levelId } });
      if (lessonIds.length > 0) {
        await prisma.roadmapLevelLesson.createMany({
          data: lessonIds.map((lessonId, index) => ({
            levelId,
            lessonId,
            order: index,
          })),
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "update_roadmap_level",
        entityType: "roadmap_level",
        entityId: levelId,
        changes: jsonChanges({ ...body, lessonCount: lessonIds?.length }),
      },
    });

    const lessonCount =
      lessonIds?.length ??
      (await prisma.roadmapLevelLesson.count({ where: { levelId } }));
    res.status(200).json({ level: { ...level, lessonCount } });
  }),
);

contentAdminRouter.delete(
  "/admin/roadmap-levels/:levelId",
  requireAuth,
  adminRoles,
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({ levelId: z.string().min(1) });
    const { levelId } = paramsSchema.parse(req.params);
    const existing = await prisma.roadmapLevel.findUnique({
      where: { id: levelId },
    });
    if (!existing) throw new HttpError(404, "Roadmap level not found");

    await prisma.roadmapLevel.delete({ where: { id: levelId } });
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_roadmap_level",
        entityType: "roadmap_level",
        entityId: levelId,
        changes: jsonChanges({ title: existing.title }),
      },
    });
    res.status(204).send();
  }),
);
