import { apiRequest } from "@/lib/api/client";

export async function startQuizSession(token: string, quizId: string) {
  return apiRequest<{ sessionId: string }>("/quiz/sessions", {
    method: "POST",
    token,
    body: { quizId },
  });
}

export async function answerQuiz(
  token: string,
  sessionId: string,
  selectedOption: number,
) {
  return apiRequest<{
    attempt?: { isCorrect: boolean };
    heartsRemaining: number;
    completedAt: string | null;
    passed: boolean | null;
  }>(`/quiz/sessions/${sessionId}/answer`, {
    method: "POST",
    token,
    body: { selectedOption },
  });
}
