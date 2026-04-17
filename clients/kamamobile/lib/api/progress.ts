import { apiRequest } from "@/lib/api/client";

export type LessonProgress = {
  lessonId: string;
  position?: number;
  completedAt?: string | null;
};

export type LessonProgressDetail = {
  id: string;
  lessonId: string;
  userId: string;
  chapterId: string;
  position?: number;
  updatedAt: string;
  lesson: {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    coverImage?: string | null;
    xpReward?: number;
  };
  chapter: {
    id: string;
    title: string;
    order: number;
  };
};

export async function completeLesson(token: string, lessonId: string) {
  return apiRequest<{
    ok: boolean;
    xpEarned: number;
    alreadyCompleted: boolean;
  }>(`/progress/lessons/${lessonId}/complete`, {
    method: "POST",
    token,
    body: {},
  });
}

export async function updateLessonProgress(
  token: string,
  lessonId: string,
  position: number,
) {
  return apiRequest<{ ok: boolean }>(`/progress/lessons/${lessonId}`, {
    method: "PATCH",
    token,
    body: { position },
  });
}

export async function getInProgressLessons(
  token: string,
): Promise<LessonProgressDetail[]> {
  const response = await apiRequest<{ progress: LessonProgressDetail[] }>(
    `/progress/lessons/in-progress`,
    {
      token,
    },
  );
  return response.progress;
}
