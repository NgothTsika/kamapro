import { apiRequest } from "@/lib/api/client";

export async function completeLesson(token: string, lessonId: string) {
  return apiRequest<{ ok: boolean; xpEarned: number; alreadyCompleted: boolean }>(
    `/progress/lessons/${lessonId}/complete`,
    {
      method: "POST",
      token,
      body: {},
    },
  );
}
