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
  method?: "GET" | "POST";
  body?: unknown;
  token?: string | null;
};

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
    const query = language ? `?language=${encodeURIComponent(language)}` : "";
    const response = await kamaRequest<{ chapter: Chapter }>(
      `/content/chapters/${chapterId}${query}`,
      {
        token: null,
      },
    );

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
  },

  async getChapterProgress(
    chapterId: string,
  ): Promise<{ success: boolean; progress: UserChapterProgress | null }> {
    return kamaRequest<{ success: boolean; progress: UserChapterProgress | null }>(
      `/content/chapters/${chapterId}/progress`,
    );
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
