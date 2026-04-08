import { apiRequest } from "@/lib/api/client";

export async function submitLessonFeedback(input: {
  token: string;
  lessonId: string;
  rating: number;
  comment?: string;
}) {
  const { token, lessonId, rating, comment } = input;
  return apiRequest<{ feedback: { id: string; rating: number; comment?: string } }>(
    `/feedback/lessons/${lessonId}`,
    {
      method: "POST",
      token,
      body: { rating, comment },
    },
  );
}
