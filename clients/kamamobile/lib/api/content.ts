import { apiRequest } from "@/lib/api/client";
import type {
  Character,
  LessonDetail,
  LessonFull,
  LessonSummary,
  Topic,
  TopicQuiz,
} from "@/lib/api/types";

export async function getTopics(): Promise<Topic[]> {
  const response = await apiRequest<{ topics: Topic[] }>("/content/topics");
  return response.topics;
}

export async function getCharacters(language?: string): Promise<Character[]> {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const response = await apiRequest<{ characters: Character[] }>(
    `/content/characters${query}`,
  );
  return response.characters;
}

export async function getLessons(language?: string): Promise<LessonSummary[]> {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const response = await apiRequest<{ lessons: LessonSummary[] }>(
    `/content/lessons${query}`,
  );
  return response.lessons;
}

export async function getLesson(lessonId: string, language?: string): Promise<LessonDetail> {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const response = await apiRequest<{ lesson: LessonDetail }>(
    `/content/lessons/${lessonId}${query}`,
  );
  return response.lesson;
}

export async function getLessonBySlug(
  slug: string,
  language?: string,
): Promise<LessonFull> {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const response = await apiRequest<{ lesson: LessonFull }>(
    `/content/lessons/slug/${slug}${query}`,
  );
  return response.lesson;
}

export async function getTopicQuizzes(topicId: string): Promise<TopicQuiz[]> {
  const response = await apiRequest<{ quizzes: TopicQuiz[] }>(
    `/content/topics/${topicId}/quizzes`,
  );
  return response.quizzes;
}

export async function getRandomTopicQuizIds(
  topicId: string,
  limit: number = 20,
): Promise<string[]> {
  const response = await apiRequest<{ quizIds: string[] }>(
    `/content/topics/${topicId}/quizzes/random?limit=${limit}`,
  );
  return response.quizIds;
}

export async function submitPollVote(
  token: string,
  quizId: string,
  selectedOption: number,
): Promise<void> {
  await apiRequest(`/content/quizzes/${quizId}/poll-vote`, {
    method: "POST",
    token,
    body: { selectedOption },
  });
}
