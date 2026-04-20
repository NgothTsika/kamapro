import { prisma } from "../../lib/prisma";
import type {
  UserChapterProgress,
  UserLessonProgress,
  ChapterCompletion,
} from "@prisma/client";

/**
 * Get or create user's chapter progress
 */
export async function getOrCreateChapterProgress(
  userId: string,
  chapterId: string,
): Promise<UserChapterProgress> {
  const existing = await prisma.userChapterProgress.findUnique({
    where: {
      userId_chapterId: { userId, chapterId },
    },
  });

  if (existing) return existing;

  // Create new progress record
  return prisma.userChapterProgress.create({
    data: {
      userId,
      chapterId,
      currentStepIndex: 0,
      completed: false,
    },
  });
}

/**
 * Get user's lesson progress
 */
export async function getLessonProgress(
  userId: string,
  lessonId: string,
): Promise<UserLessonProgress> {
  const existing = await prisma.userLessonProgress.findUnique({
    where: {
      userId_lessonId: { userId, lessonId },
    },
  });

  if (existing) return existing;

  // Create new progress
  return prisma.userLessonProgress.create({
    data: {
      userId,
      lessonId,
      currentChapterIndex: 0,
    },
  });
}

/**
 * Advance chapter progress to next step
 */
export async function advanceChapterStep(
  userId: string,
  chapterId: string,
  fromStepIndex: number,
): Promise<UserChapterProgress> {
  // Get chapter to validate step index
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  if (!chapter) throw new Error("Chapter not found");

  const nextIndex = fromStepIndex + 1;
  const isComplete = nextIndex >= chapter.steps.length;

  const updated = await prisma.userChapterProgress.update({
    where: {
      userId_chapterId: { userId, chapterId },
    },
    data: {
      currentStepIndex: nextIndex,
      completed: isComplete,
      completedAt: isComplete ? new Date() : null,
    },
  });

  return updated;
}

/**
 * Complete chapter
 */
export async function completeChapter(
  userId: string,
  chapterId: string,
): Promise<{ progress: UserChapterProgress; completion: ChapterCompletion }> {
  // Update progress
  const progress = await prisma.userChapterProgress.update({
    where: {
      userId_chapterId: { userId, chapterId },
    },
    data: {
      completed: true,
      completedAt: new Date(),
    },
  });

  // Record completion
  const completion = await prisma.chapterCompletion.create({
    data: {
      userId,
      chapterId,
      completedAt: new Date(),
    },
  });

  return { progress, completion };
}

/**
 * Advance to next chapter in lesson
 */
export async function advanceLesson(
  userId: string,
  lessonId: string,
): Promise<UserLessonProgress> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      chapters: { orderBy: { order: "asc" } },
    },
  });

  if (!lesson) throw new Error("Lesson not found");

  const currentProgress = await getLessonProgress(userId, lessonId);
  const nextIndex = currentProgress.currentChapterIndex + 1;

  // Only advance if next chapter exists
  if (nextIndex < lesson.chapters.length) {
    return prisma.userLessonProgress.update({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      data: {
        currentChapterIndex: nextIndex,
      },
    });
  }

  return currentProgress;
}

/**
 * Get user's progress with all chapters and steps
 */
export async function getUserLessonProgressWithDetails(
  userId: string,
  lessonId: string,
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: {
          steps: { orderBy: { order: "asc" } },
          chapterProgress: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!lesson) throw new Error("Lesson not found");

  const lessonProgress = await getLessonProgress(userId, lessonId);

  return {
    lesson,
    lessonProgress,
    currentChapter: lesson.chapters[lessonProgress.currentChapterIndex],
  };
}
