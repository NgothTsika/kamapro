import { useState, useEffect } from "react";
import { kama } from "../lib/kama-api";
import type { LessonProgressDetails, UserChapterProgress } from "../lib/types";

export function useChapterProgress(chapterId: string, lessonId: string) {
  const [progress, setProgress] = useState<UserChapterProgress | null>(null);
  const [lessonProgress, setLessonProgress] =
    useState<LessonProgressDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chapterId || !lessonId) return;
    loadProgress();
  }, [chapterId, lessonId]);

  async function loadProgress() {
    try {
      setLoading(true);
      const [chapterData, lessonData] = await Promise.all([
        kama.getChapterProgress(chapterId),
        kama.getLessonProgress(lessonId),
      ]);
      setProgress(chapterData.progress);
      setLessonProgress(lessonData.progress);
    } catch (err) {
      console.error("Failed to load progress:", err);
    } finally {
      setLoading(false);
    }
  }

  async function advanceStep(currentIndex: number) {
    try {
      setLoading(true);
      const updated = await kama.advanceChapterStep(
        lessonId,
        chapterId,
        currentIndex,
      );
      setProgress(updated.progress);
      setLessonProgress((current) =>
        current
          ? {
              ...current,
              lesson: {
                ...current.lesson,
                chapters: current.lesson.chapters.map((chapter) =>
                  chapter.id === chapterId
                    ? { ...chapter, chapterProgress: [updated.progress] }
                    : chapter,
                ),
              },
            }
          : current,
      );
    } catch (err) {
      console.error("Failed to advance step:", err);
    } finally {
      setLoading(false);
    }
  }

  async function setStepIndex(stepIndex: number) {
    try {
      setLoading(true);
      const updated = await kama.setChapterStepIndex(
        lessonId,
        chapterId,
        stepIndex,
      );
      setProgress(updated.progress);
      setLessonProgress((current) =>
        current
          ? {
              ...current,
              lesson: {
                ...current.lesson,
                chapters: current.lesson.chapters.map((chapter) =>
                  chapter.id === chapterId
                    ? { ...chapter, chapterProgress: [updated.progress] }
                    : chapter,
                ),
              },
            }
          : current,
      );
    } catch (err) {
      console.error("Failed to update chapter step:", err);
    } finally {
      setLoading(false);
    }
  }

  async function completeChapter() {
    try {
      setLoading(true);
      const result = await kama.completeChapter(lessonId, chapterId);
      setProgress(result.progress);
      setLessonProgress((current) =>
        current
          ? {
              ...current,
              lesson: {
                ...current.lesson,
                chapters: current.lesson.chapters.map((chapter) =>
                  chapter.id === chapterId
                    ? { ...chapter, chapterProgress: [result.progress] }
                    : chapter,
                ),
              },
            }
          : current,
      );
    } catch (err) {
      console.error("Failed to complete chapter:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    progress,
    lessonProgress,
    loading,
    advanceStep,
    setStepIndex,
    completeChapter,
    reload: loadProgress,
  };
}
