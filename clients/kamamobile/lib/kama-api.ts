import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, ApiError } from "@/lib/api";
import { loadToken } from "@/lib/auth/token-storage";
import type {
  Chapter,
  LessonProgressDetails,
  StepResponseRecord,
  UserChapterProgress,
} from "@/lib/types";
import {
  normalizeOptionImages,
  normalizeQuizType,
  normalizeStringList,
} from "@/lib/quiz/normalize";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string | null;
};

const CHAPTER_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const CHAPTER_CACHE_PREFIX = "kama:chapter:v2";
const chapterMemoryCache = new Map<
  string,
  { savedAt: number; data: { chapter: Chapter } }
>();

function getChapterCacheKey(chapterId: string, language?: string) {
  return `${CHAPTER_CACHE_PREFIX}:${language ?? "default"}:${chapterId}`;
}

function normalizeChapterResponse(response: { chapter: Chapter }): {
  chapter: Chapter;
} {
  return {
    chapter: {
      ...response.chapter,
      quizzes: response.chapter.quizzes?.map((quiz) => {
        const options = normalizeStringList(quiz.options);
        const optionImages = normalizeOptionImages(
          quiz.optionImages,
          options.length,
        ).filter((image): image is string => Boolean(image));

        return {
          ...quiz,
          type: normalizeQuizType(quiz.type),
          options,
          optionImages,
        };
      }),
    },
  };
}

async function readCachedChapter(
  chapterId: string,
  language?: string,
): Promise<{ chapter: Chapter } | null> {
  const cacheKey = getChapterCacheKey(chapterId, language);
  const memoryEntry = chapterMemoryCache.get(cacheKey);
  const now = Date.now();

  if (memoryEntry && now - memoryEntry.savedAt < CHAPTER_CACHE_TTL_MS) {
    return memoryEntry.data;
  }

  try {
    const rawValue = await AsyncStorage.getItem(cacheKey);
    if (!rawValue) return null;

    const entry = JSON.parse(rawValue) as {
      savedAt?: number;
      data?: { chapter: Chapter };
    };

    if (!entry.savedAt || !entry.data) return null;
    if (now - entry.savedAt >= CHAPTER_CACHE_TTL_MS) return null;

    chapterMemoryCache.set(cacheKey, {
      savedAt: entry.savedAt,
      data: entry.data,
    });
    return entry.data;
  } catch {
    return null;
  }
}

async function writeCachedChapter(
  chapterId: string,
  language: string | undefined,
  data: { chapter: Chapter },
) {
  const cacheKey = getChapterCacheKey(chapterId, language);
  const entry = { savedAt: Date.now(), data };
  chapterMemoryCache.set(cacheKey, entry);

  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    // Content cache is an optimization only.
  }
}

async function kamaRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token =
    options.token === undefined ? await loadToken() : (options.token ?? null);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errorBody = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = errorBody.error ?? errorBody.message ?? message;
    } catch {
      // Ignore malformed error payloads.
    }
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export const kama = {
  async getChapter(
    chapterId: string,
    language?: string,
  ): Promise<{ chapter: Chapter }> {
    const cachedChapter = await readCachedChapter(chapterId, language);
    if (cachedChapter) {
      return cachedChapter;
    }

    const query = language ? `?language=${encodeURIComponent(language)}` : "";
    try {
      const response = await kamaRequest<{ chapter: Chapter }>(
        `/content/chapters/${chapterId}${query}`,
        {
          token: null,
        },
      );
      const normalized = normalizeChapterResponse(response);
      await writeCachedChapter(chapterId, language, normalized);
      return normalized;
    } catch (error) {
      const staleMemoryEntry = chapterMemoryCache.get(
        getChapterCacheKey(chapterId, language),
      );
      if (staleMemoryEntry) {
        return staleMemoryEntry.data;
      }
      throw error;
    }
  },

  async getChapterProgress(
    chapterId: string,
  ): Promise<{ success: boolean; progress: UserChapterProgress | null }> {
    return kamaRequest<{
      success: boolean;
      progress: UserChapterProgress | null;
    }>(`/content/chapters/${chapterId}/progress`);
  },

  async getLessonProgress(
    lessonId: string,
  ): Promise<{ success: boolean; progress: LessonProgressDetails }> {
    return kamaRequest<{ success: boolean; progress: LessonProgressDetails }>(
      `/content/lessons/${lessonId}/progress`,
    );
  },

  async respondToStep(input: {
    lessonId: string;
    chapterId: string;
    stepId: string;
    type: "poll" | "choice" | "quiz";
    selectedOption: number;
    chosenStepId?: string;
  }): Promise<{ success: boolean; response: StepResponseRecord }> {
    const { lessonId, chapterId, stepId, ...body } = input;
    return kamaRequest<{ success: boolean; response: StepResponseRecord }>(
      `/content/lessons/${lessonId}/chapters/${chapterId}/steps/${stepId}/respond`,
      {
        method: "POST",
        body,
      },
    );
  },

  async advanceChapterStep(
    lessonId: string,
    chapterId: string,
    fromStepIndex: number,
  ): Promise<{ success: boolean; progress: UserChapterProgress }> {
    return kamaRequest<{ success: boolean; progress: UserChapterProgress }>(
      `/content/lessons/${lessonId}/chapters/${chapterId}/advance`,
      {
        method: "POST",
        body: { fromStepIndex },
      },
    );
  },

  async setChapterStepIndex(
    lessonId: string,
    chapterId: string,
    stepIndex: number,
  ): Promise<{ success: boolean; progress: UserChapterProgress }> {
    return kamaRequest<{ success: boolean; progress: UserChapterProgress }>(
      `/content/lessons/${lessonId}/chapters/${chapterId}/step-index`,
      {
        method: "PATCH",
        body: { stepIndex },
      },
    );
  },

  async completeChapter(
    lessonId: string,
    chapterId: string,
  ): Promise<{ success: boolean; progress: UserChapterProgress }> {
    return kamaRequest<{ success: boolean; progress: UserChapterProgress }>(
      `/content/lessons/${lessonId}/chapters/${chapterId}/complete`,
      {
        method: "POST",
      },
    );
  },
};
