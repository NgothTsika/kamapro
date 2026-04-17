import type {
  Achievement,
  AdminCategory,
  AdminCharacter,
  AdminCharacterDetail,
  AdminCharacterCollectionSummary,
  AdminCharacterCollectionDetail,
  AdminLessonDetail,
  AdminLessonSummary,
  AdminUser,
  Character,
  CharacterTranslationAdmin,
  Chapter,
  Lesson,
  LessonTranslationAdmin,
  MeUser,
  ModerationReport,
  ModerationSubmission,
  Quiz,
  QuizAdmin,
  QuizTranslationAdmin,
  AdminReportStatus,
  AdminSubmissionStatus,
  AdminTopic,
  UserHeartsResponse,
  UserStreakResponse,
  UnlockedCharactersResponse,
  CharacterUnlockProgress,
  UnlockCharacterResponse,
  PurchaseCharacterResponse,
  FavoriteCharacterResponse,
  ChallengesResponse,
  ClaimChallengeResponse,
  ChallengeStatsResponse,
  GamificationSummary,
  FreezeStreakResponse,
  StreakCheckInResponse,
} from "@/lib/kama-types";

// Use the local Next.js API proxy instead of calling backend directly
// This ensures consistent behavior across environments and proper auth handling
const API_BASE_URL = "/api";

type ApiOptions = {
  token?: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
};

class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
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
      // ignore non-json response body
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export { ApiError, API_BASE_URL };

export async function getMe(token: string): Promise<MeUser> {
  const data = await apiRequest<{ user: MeUser }>("/users/me", { token });
  return data.user;
}

// ==================== Admin Moderation ====================
export async function getAdminReports(
  token: string,
  status?: AdminReportStatus,
): Promise<{ reports: ModerationReport[]; total: number }> {
  const query = status ? `?status=${status}` : "";
  return apiRequest<{ reports: ModerationReport[]; total: number }>(
    `/moderation/admin/reports${query}`,
    { token },
  );
}

export async function reviewAdminReport(
  token: string,
  reportId: string,
  status: Exclude<AdminReportStatus, "OPEN">,
): Promise<ModerationReport> {
  const data = await apiRequest<{ report: ModerationReport }>(
    `/moderation/admin/reports/${reportId}/review`,
    {
      token,
      method: "PATCH",
      body: { status },
    },
  );
  return data.report;
}

export async function getAdminSubmissions(
  token: string,
  status?: AdminSubmissionStatus,
): Promise<{ submissions: ModerationSubmission[]; total: number }> {
  const query = status ? `?status=${status}` : "";
  return apiRequest<{ submissions: ModerationSubmission[]; total: number }>(
    `/moderation/admin/submissions${query}`,
    { token },
  );
}

export async function approveSubmission(token: string, submissionId: string) {
  return apiRequest<{ submission: ModerationSubmission }>(
    `/moderation/admin/submissions/${submissionId}/approve`,
    {
      token,
      method: "PATCH",
    },
  );
}

export async function rejectSubmission(
  token: string,
  submissionId: string,
  reason: string,
) {
  return apiRequest<{ submission: ModerationSubmission }>(
    `/moderation/admin/submissions/${submissionId}/reject`,
    {
      token,
      method: "PATCH",
      body: { reason },
    },
  );
}

export async function getAchievementsCatalog(
  token?: string,
): Promise<Achievement[]> {
  const data = await apiRequest<{ achievements: Achievement[] }>(
    "/achievements/catalog",
    {
      ...(token ? { token } : {}),
    },
  );
  return data.achievements;
}

export async function createAchievement(
  token: string,
  payload: {
    name: string;
    description: string;
    icon?: string;
    xpRequired?: number;
    streakRequired?: number;
  },
): Promise<Achievement> {
  const data = await apiRequest<{ achievement: Achievement }>(
    "/achievements/catalog",
    {
      token,
      method: "POST",
      body: payload,
    },
  );
  return data.achievement;
}

export async function updateAchievement(
  token: string,
  achievementId: string,
  payload: {
    name?: string;
    description?: string;
    icon?: string;
    xpRequired?: number | null;
    streakRequired?: number | null;
  },
): Promise<Achievement> {
  const data = await apiRequest<{ achievement: Achievement }>(
    `/achievements/catalog/${achievementId}`,
    {
      token,
      method: "PATCH",
      body: payload,
    },
  );
  return data.achievement;
}

export async function deleteAchievement(
  token: string,
  achievementId: string,
): Promise<void> {
  await apiRequest<void>(`/achievements/catalog/${achievementId}`, {
    token,
    method: "DELETE",
  });
}

// ---------- Content admin (ADMIN / MODERATOR) ----------

export async function getAdminCategories(
  token: string,
): Promise<AdminCategory[]> {
  const data = await apiRequest<{ categories: AdminCategory[] }>(
    "/content/admin/categories",
    {
      token,
    },
  );
  return data.categories;
}

export async function createAdminCategory(
  token: string,
  payload: {
    name: string;
    slug?: string;
    description?: string | null;
    coverImage?: string | null;
    icon?: string | null;
    order?: number;
  },
): Promise<AdminCategory> {
  const data = await apiRequest<{ category: AdminCategory }>(
    "/content/admin/categories",
    {
      token,
      method: "POST",
      body: payload,
    },
  );
  return data.category;
}

export async function updateAdminCategory(
  token: string,
  categoryId: string,
  payload: Partial<{
    name: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    icon: string | null;
    order: number;
  }>,
): Promise<AdminCategory> {
  const data = await apiRequest<{ category: AdminCategory }>(
    `/content/admin/categories/${categoryId}`,
    {
      token,
      method: "PATCH",
      body: payload,
    },
  );
  return data.category;
}

export async function deleteAdminCategory(token: string, categoryId: string) {
  await apiRequest<void>(`/content/admin/categories/${categoryId}`, {
    token,
    method: "DELETE",
  });
}

export async function getAdminTopics(token: string): Promise<AdminTopic[]> {
  const data = await apiRequest<{ topics: AdminTopic[] }>(
    "/content/admin/topics",
    { token },
  );
  return data.topics;
}

export async function createAdminTopic(
  token: string,
  payload: {
    name: string;
    slug?: string;
    description?: string | null;
    coverImage?: string | null;
    parentId?: string | null;
  },
): Promise<AdminTopic> {
  const data = await apiRequest<{ topic: AdminTopic }>(
    "/content/admin/topics",
    {
      token,
      method: "POST",
      body: payload,
    },
  );
  return data.topic;
}

export async function updateAdminTopic(
  token: string,
  topicId: string,
  payload: Partial<{
    name: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    parentId: string | null;
  }>,
): Promise<AdminTopic> {
  const data = await apiRequest<{ topic: AdminTopic }>(
    `/content/admin/topics/${topicId}`,
    {
      token,
      method: "PATCH",
      body: payload,
    },
  );
  return data.topic;
}

export async function deleteAdminTopic(token: string, topicId: string) {
  await apiRequest<void>(`/content/admin/topics/${topicId}`, {
    token,
    method: "DELETE",
  });
}

export async function getAdminLessons(
  token: string,
  published?: "all" | "true" | "false",
): Promise<AdminLessonSummary[]> {
  const q = published && published !== "all" ? `?published=${published}` : "";
  const data = await apiRequest<{ lessons: AdminLessonSummary[] }>(
    `/content/admin/lessons${q}`,
    { token },
  );
  return data.lessons;
}

export async function getAdminLesson(
  token: string,
  lessonId: string,
): Promise<AdminLessonDetail> {
  const data = await apiRequest<{ lesson: AdminLessonDetail }>(
    `/content/admin/lessons/${lessonId}`,
    { token },
  );
  return data.lesson;
}

export async function createAdminLesson(
  token: string,
  payload: {
    title: string;
    slug?: string;
    description?: string | null;
    content?: string;
    hook?: string | null;
    coverImage?: string | null;
    xpReward?: number;
    isPremium?: boolean;
    published?: boolean;
    order?: number;
    categoryId?: string | null;
    topicId?: string | null;
    deepDiveContent?: string | null;
    titleAudioUrl?: string | null; // NEW
    hookAudioUrl?: string | null; // NEW
    contentAudioUrl?: string | null; // NEW
    deepDiveAudioUrl?: string | null; // NEW
    characterIds?: string[]; // NEW
  },
): Promise<AdminLessonDetail> {
  const data = await apiRequest<{ lesson: AdminLessonDetail }>(
    "/content/admin/lessons",
    {
      token,
      method: "POST",
      body: payload,
    },
  );
  return data.lesson;
}

export async function updateAdminLesson(
  token: string,
  lessonId: string,
  payload: Partial<{
    title: string;
    slug: string;
    description: string | null;
    content: string;
    hook: string | null;
    coverImage: string | null;
    xpReward: number;
    isPremium: boolean;
    published: boolean;
    order: number;
    categoryId: string | null;
    topicId: string | null;
    deepDiveContent: string | null;
    titleAudioUrl: string | null; // NEW
    hookAudioUrl: string | null; // NEW
    contentAudioUrl: string | null; // NEW
    deepDiveAudioUrl: string | null; // NEW
    characterIds: string[]; // NEW
  }>,
): Promise<AdminLessonDetail> {
  const data = await apiRequest<{ lesson: AdminLessonDetail }>(
    `/content/admin/lessons/${lessonId}`,
    {
      token,
      method: "PATCH",
      body: payload,
    },
  );
  return data.lesson;
}

export async function deleteAdminLesson(token: string, lessonId: string) {
  await apiRequest<void>(`/content/admin/lessons/${lessonId}`, {
    token,
    method: "DELETE",
  });
}

export async function createAdminChapter(
  token: string,
  lessonId: string,
  payload: {
    title: string;
    content: string;
    coverImage?: string | null;
    mediaType?: string | null;
    mediaUrl?: string | null;
    feedbackQuestion?: string | null;
    order?: number;
  },
): Promise<Chapter> {
  const data = await apiRequest<{ chapter: Chapter }>(
    `/content/admin/lessons/${lessonId}/chapters`,
    {
      token,
      method: "POST",
      body: payload,
    },
  );
  return data.chapter;
}

export async function updateAdminChapter(
  token: string,
  chapterId: string,
  payload: Partial<{
    title: string;
    content: string;
    coverImage: string | null;
    mediaType: string | null;
    mediaUrl: string | null;
    feedbackQuestion: string | null;
    order: number;
  }>,
): Promise<Chapter> {
  const data = await apiRequest<{ chapter: Chapter }>(
    `/content/admin/chapters/${chapterId}`,
    {
      token,
      method: "PATCH",
      body: payload,
    },
  );
  return data.chapter;
}

export async function deleteAdminChapter(token: string, chapterId: string) {
  await apiRequest<void>(`/content/admin/chapters/${chapterId}`, {
    token,
    method: "DELETE",
  });
}

export async function createAdminQuiz(
  token: string,
  lessonId: string,
  payload: {
    question: string;
    options: string[];
    correctOption?: number | null;
    explanation?: string | null;
    order?: number;
    heartLimit?: number;
    timeLimitSeconds?: number | null;
    difficulty?: string | null;
    isActive?: boolean;
    tags?: string[];
    topicId?: string | null;
    questionAudioUrl?: string | null; // NEW
    isPoll?: boolean; // NEW
    pollDescription?: string | null; // NEW
  },
): Promise<QuizAdmin> {
  const data = await apiRequest<{ quiz: QuizAdmin }>(
    `/content/admin/lessons/${lessonId}/quizzes`,
    {
      token,
      method: "POST",
      body: payload,
    },
  );
  return data.quiz;
}

export async function getAdminLessonQuizzes(
  token: string,
  lessonId: string,
): Promise<QuizAdmin[]> {
  const data = await apiRequest<{ quizzes: QuizAdmin[] }>(
    `/content/admin/lessons/${lessonId}/quizzes`,
    { token },
  );
  return data.quizzes;
}

export async function updateAdminQuiz(
  token: string,
  quizId: string,
  payload: Partial<{
    question: string;
    options: string[];
    correctOption: number | null;
    explanation: string | null;
    order: number;
    heartLimit: number;
    timeLimitSeconds: number | null;
    difficulty: string | null;
    isActive: boolean;
    tags: string[];
    topicId: string | null;
    questionAudioUrl: string | null; // NEW
    isPoll: boolean; // NEW
    pollDescription: string | null; // NEW
  }>,
): Promise<QuizAdmin> {
  const data = await apiRequest<{ quiz: QuizAdmin }>(
    `/content/admin/quizzes/${quizId}`,
    {
      token,
      method: "PATCH",
      body: payload,
    },
  );
  return data.quiz;
}

export async function deleteAdminQuiz(token: string, quizId: string) {
  await apiRequest<void>(`/content/admin/quizzes/${quizId}`, {
    token,
    method: "DELETE",
  });
}

export async function getQuizTranslations(
  token: string,
  quizId: string,
): Promise<QuizTranslationAdmin[]> {
  const data = await apiRequest<{ translations: QuizTranslationAdmin[] }>(
    `/content/admin/quizzes/${quizId}/translations`,
    { token },
  );
  return data.translations;
}

export async function createQuizTranslation(
  token: string,
  quizId: string,
  payload: {
    language: string;
    question: string;
    options: string[];
    explanation?: string | null;
    pollDescription?: string | null; // NEW
  },
): Promise<QuizTranslationAdmin> {
  const data = await apiRequest<{ translation: QuizTranslationAdmin }>(
    `/content/admin/quizzes/${quizId}/translations`,
    {
      token,
      method: "POST",
      body: payload,
    },
  );
  return data.translation;
}

export async function updateQuizTranslation(
  token: string,
  translationId: string,
  payload: Partial<{
    language: string;
    question: string;
    options: string[];
    explanation: string | null;
    pollDescription: string | null; // NEW
  }>,
): Promise<QuizTranslationAdmin> {
  const data = await apiRequest<{ translation: QuizTranslationAdmin }>(
    `/content/admin/quiz-translations/${translationId}`,
    {
      token,
      method: "PATCH",
      body: payload,
    },
  );
  return data.translation;
}

export async function deleteQuizTranslation(
  token: string,
  translationId: string,
) {
  await apiRequest<void>(`/content/admin/quiz-translations/${translationId}`, {
    token,
    method: "DELETE",
  });
}

export async function getLessonTranslations(
  token: string,
  lessonId: string,
): Promise<LessonTranslationAdmin[]> {
  const data = await apiRequest<{ translations: LessonTranslationAdmin[] }>(
    `/content/admin/lessons/${lessonId}/translations`,
    { token },
  );
  return data.translations;
}

export async function createLessonTranslation(
  token: string,
  lessonId: string,
  payload: {
    language: string;
    title: string;
    description?: string | null;
    content: string;
    hook?: string | null;
    deepDiveContent?: string | null;
  },
): Promise<LessonTranslationAdmin> {
  const data = await apiRequest<{ translation: LessonTranslationAdmin }>(
    `/content/admin/lessons/${lessonId}/translations`,
    {
      token,
      method: "POST",
      body: payload,
    },
  );
  return data.translation;
}

export async function updateLessonTranslation(
  token: string,
  translationId: string,
  payload: Partial<{
    language: string;
    title: string;
    description: string | null;
    content: string;
    hook: string | null;
    deepDiveContent: string | null;
  }>,
): Promise<LessonTranslationAdmin> {
  const data = await apiRequest<{ translation: LessonTranslationAdmin }>(
    `/content/admin/translations/${translationId}`,
    {
      token,
      method: "PATCH",
      body: payload,
    },
  );
  return data.translation;
}

export async function deleteLessonTranslation(
  token: string,
  translationId: string,
) {
  await apiRequest<void>(`/content/admin/translations/${translationId}`, {
    token,
    method: "DELETE",
  });
}

export async function getAdminCharacters(
  token: string,
): Promise<AdminCharacter[]> {
  const data = await apiRequest<{ characters: AdminCharacter[] }>(
    "/content/admin/characters",
    {
      token,
    },
  );
  return data.characters;
}

export async function createAdminCharacter(
  token: string,
  payload: {
    name: string;
    slug?: string;
    description: string;
    story?: string | null;
    imageUrl?: string | null;
    inventionImage?: string | null;
    xpThreshold?: number | null;
    rarityLevel?: string | null;
    categoryId?: string | null;
    unlockLessonId?: string | null;
    characterType?: string;
    birthYear?: number | null;
    deathYear?: number | null;
    country?: string | null;
    achievements?: string[];
    metadata?: Record<string, any>;
  },
): Promise<AdminCharacter> {
  const data = await apiRequest<{ character: AdminCharacter }>(
    "/content/admin/characters",
    {
      token,
      method: "POST",
      body: payload,
    },
  );
  return data.character;
}

export async function updateAdminCharacter(
  token: string,
  characterId: string,
  payload: Partial<{
    name: string;
    slug: string;
    description: string;
    story: string | null;
    imageUrl: string | null;
    inventionImage: string | null;
    xpThreshold: number | null;
    rarityLevel: string | null;
    categoryId: string | null;
    unlockLessonId: string | null;
    entityType: string;
    personType: string | null;
    placeType: string | null;
    eventType: string | null;
    traditionType: string | null;
    conceptType: string | null;
    birthYear: number | null;
    endYear: number | null;
    country: string | null;
    achievements: string[];
    metadata: Record<string, any>;
  }>,
): Promise<AdminCharacter> {
  const data = await apiRequest<{ character: AdminCharacter }>(
    `/content/admin/characters/${characterId}`,
    {
      token,
      method: "PATCH",
      body: payload,
    },
  );
  return data.character;
}

export async function deleteAdminCharacter(token: string, characterId: string) {
  await apiRequest<void>(`/content/admin/characters/${characterId}`, {
    token,
    method: "DELETE",
  });
}

export async function getAdminCharacter(
  token: string,
  characterId: string,
): Promise<AdminCharacterDetail> {
  const data = await apiRequest<{ character: AdminCharacterDetail }>(
    `/content/admin/characters/${characterId}`,
    {
      token,
    },
  );
  return data.character;
}

export async function createCharacterTranslation(
  token: string,
  characterId: string,
  payload: {
    language: string;
    name: string;
    description: string;
    story?: string | null;
  },
): Promise<CharacterTranslationAdmin> {
  const data = await apiRequest<{ translation: CharacterTranslationAdmin }>(
    `/content/admin/characters/${characterId}/translations`,
    {
      token,
      method: "POST",
      body: payload,
    },
  );
  return data.translation;
}

export async function updateCharacterTranslation(
  token: string,
  translationId: string,
  payload: {
    language: string;
    name: string;
    description: string;
    story?: string | null;
  },
): Promise<CharacterTranslationAdmin> {
  const data = await apiRequest<{ translation: CharacterTranslationAdmin }>(
    `/content/admin/character-translations/${translationId}`,
    {
      token,
      method: "PATCH",
      body: payload,
    },
  );
  return data.translation;
}

export async function deleteCharacterTranslation(
  token: string,
  translationId: string,
): Promise<void> {
  await apiRequest<void>(
    `/content/admin/character-translations/${translationId}`,
    {
      token,
      method: "DELETE",
    },
  );
}

// ==================== Users (Admin) ====================

export async function getAdminUsers(token: string): Promise<AdminUser[]> {
  const data = await apiRequest<{ users: AdminUser[] }>("/users/admin", {
    token,
  });
  return data.users;
}

export async function createAdminUser(
  token: string,
  payload: {
    email: string;
    password: string;
    role: string;
    name?: string;
  },
): Promise<AdminUser> {
  const data = await apiRequest<{ user: AdminUser }>("/users/admin", {
    token,
    method: "POST",
    body: payload,
  });
  return data.user;
}

export async function updateAdminUser(
  token: string,
  userId: string,
  payload: { role?: string; xp?: number },
): Promise<AdminUser> {
  const data = await apiRequest<{ user: AdminUser }>(`/users/admin/${userId}`, {
    token,
    method: "PATCH",
    body: payload,
  });
  return data.user;
}

export async function deleteAdminUser(token: string, userId: string) {
  await apiRequest<void>(`/users/admin/${userId}`, {
    token,
    method: "DELETE",
  });
}

// ---------- Poll Voting ----------

// Submit or update a user's vote on a poll question
export async function submitPollVote(
  token: string,
  quizId: string,
  selectedOption: number,
): Promise<{
  message: string;
  vote: {
    id: string;
    userId: string;
    quizId: string;
    selectedOption: number;
    votedAt: string;
  };
  pollResults: Record<string, number>;
  totalVotes: number;
}> {
  const data = await apiRequest<{
    message: string;
    vote: {
      id: string;
      userId: string;
      quizId: string;
      selectedOption: number;
      votedAt: string;
    };
    pollResults: Record<string, number>;
    totalVotes: number;
  }>(`/content/quizzes/${quizId}/poll-vote`, {
    token,
    method: "POST",
    body: { selectedOption },
  });
  return data;
}

// Get poll results including vote counts and percentages
export async function getPollResults(
  quizId: string,
  token?: string,
): Promise<{
  id: string;
  question: string;
  options: string[];
  pollResults: Record<string, number>;
  totalVotes: number;
  userVote?: number;
}> {
  const data = await apiRequest<{
    id: string;
    question: string;
    options: string[];
    pollResults: Record<string, number>;
    totalVotes: number;
    userVote?: number;
  }>(`/content/quizzes/${quizId}/poll-results`, {
    token,
  });
  return data;
}

// Get admin poll analytics for a specific quiz
export async function getAdminPollAnalytics(
  token: string,
  quizId: string,
): Promise<{
  id: string;
  question: string;
  options: string[];
  pollResults: Record<string, number>;
  totalVotes: number;
  pollVotes: Array<{ userId: string; selectedOption: number; votedAt: string }>;
}> {
  const data = await apiRequest<{
    id: string;
    question: string;
    options: string[];
    pollResults: Record<string, number>;
    totalVotes: number;
    pollVotes: Array<{
      userId: string;
      selectedOption: number;
      votedAt: string;
    }>;
  }>(`/content/admin/quizzes/${quizId}/analytics`, {
    token,
  });
  return data;
}

// Reset poll results (admin only)
export async function resetPollVotes(
  token: string,
  quizId: string,
): Promise<{ message: string }> {
  const data = await apiRequest<{ message: string }>(
    `/content/admin/quizzes/${quizId}/poll-votes`,
    {
      token,
      method: "DELETE",
    },
  );
  return data;
}

// ==================== Public Content API ====================

// Get all published lessons
export async function getLessons(language?: string): Promise<Lesson[]> {
  const query = language ? `?language=${language}` : "";
  const data = await apiRequest<{ lessons: Lesson[] }>(
    `/content/lessons${query}`,
  );
  return data.lessons;
}

// Get lesson by ID
export async function getLesson(
  lessonId: string,
  language?: string,
): Promise<Lesson> {
  const query = language ? `?language=${language}` : "";
  const data = await apiRequest<{ lesson: Lesson }>(
    `/content/lessons/${lessonId}${query}`,
  );
  return data.lesson;
}

// Get lesson by slug
export async function getLessonBySlug(
  slug: string,
  language?: string,
): Promise<Lesson> {
  const query = language ? `?language=${language}` : "";
  const data = await apiRequest<{ lesson: Lesson }>(
    `/content/lessons/slug/${slug}${query}`,
  );
  return data.lesson;
}

// Get quizzes for a lesson
export async function getQuizzes(
  lessonId: string,
  language?: string,
): Promise<Quiz[]> {
  const query = language ? `?language=${language}` : "";
  const data = await apiRequest<{ quizzes: Quiz[] }>(
    `/content/lessons/${lessonId}/quizzes${query}`,
  );
  return data.quizzes;
}

// Get all characters
export async function getCharacters(language?: string): Promise<Character[]> {
  const query = language ? `?language=${language}` : "";
  const data = await apiRequest<{ characters: Character[] }>(
    `/content/characters${query}`,
  );
  return data.characters;
}

// Get character by ID
export async function getCharacter(
  characterId: string,
  language?: string,
): Promise<Character> {
  const query = language ? `?language=${language}` : "";
  const data = await apiRequest<{ character: Character }>(
    `/content/characters/${characterId}${query}`,
  );
  return data.character;
}

// Get character by slug
export async function getCharacterBySlug(
  slug: string,
  language?: string,
): Promise<Character> {
  const query = language ? `?language=${language}` : "";
  const data = await apiRequest<{ character: Character }>(
    `/content/characters/slug/${slug}${query}`,
  );
  return data.character;
}

// ============================================================================
// FEEDBACK ADMIN API
// ============================================================================

export const feedbackAdminAPI = {
  /**
   * Get all feedback with optional filtering
   */
  async getAllFeedback(
    token: string,
    limit: number = 50,
    offset: number = 0,
    lessonId?: string,
    minRating?: number,
    maxRating?: number,
  ) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (lessonId) params.append("lessonId", lessonId);
    if (minRating) params.append("minRating", minRating.toString());
    if (maxRating) params.append("maxRating", maxRating.toString());

    return apiRequest<any>(`/admin/feedback?${params.toString()}`, { token });
  },

  /**
   * Get feedback statistics for all lessons
   */
  async getStats(token: string) {
    return apiRequest<any>("/admin/feedback/stats", { token });
  },

  /**
   * Get feedback statistics for a specific lesson
   */
  async getLessonStats(token: string, lessonId: string) {
    return apiRequest<any>(`/admin/feedback/lessons/${lessonId}/stats`, {
      token,
    });
  },

  /**
   * Get all feedback from a specific user
   */
  async getUserFeedback(
    token: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return apiRequest<any>(
      `/admin/feedback/users/${userId}?${params.toString()}`,
      { token },
    );
  },

  /**
   * Delete a specific feedback entry
   */
  async deleteFeedback(token: string, feedbackId: string) {
    return apiRequest<any>(`/admin/feedback/${feedbackId}`, {
      token,
      method: "DELETE",
    });
  },

  /**
   * Delete all feedback from a user
   */
  async deleteUserFeedback(token: string, userId: string) {
    return apiRequest<any>(`/admin/feedback/users/${userId}`, {
      token,
      method: "DELETE",
    });
  },
};

// ============================================================================
// MODERATION ADMIN API
// ============================================================================

export const moderationAdminAPI = {
  /**
   * Get all reports with optional filtering
   */
  async getAllReports(
    token: string,
    limit: number = 50,
    offset: number = 0,
    status?: "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED",
    type?: "submission" | "lesson",
  ) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (status) params.append("status", status);
    if (type) params.append("type", type);

    return apiRequest<any>(`/admin/moderation/reports?${params.toString()}`, {
      token,
    });
  },

  /**
   * Get specific report details
   */
  async getReportDetails(token: string, reportId: string) {
    return apiRequest<any>(`/admin/moderation/reports/${reportId}`, { token });
  },

  /**
   * Update report status
   */
  async updateReportStatus(
    token: string,
    reportId: string,
    status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED",
    notes?: string,
  ) {
    return apiRequest<any>(`/admin/moderation/reports/${reportId}`, {
      token,
      method: "PATCH",
      body: { status, notes },
    });
  },

  /**
   * Bulk update multiple reports
   */
  async bulkUpdateReports(
    token: string,
    reportIds: string[],
    status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED",
  ) {
    return apiRequest<any>(`/admin/moderation/reports/bulk-update`, {
      token,
      method: "POST",
      body: { reportIds, status },
    });
  },

  /**
   * Get moderation dashboard statistics
   */
  async getStats(token: string) {
    return apiRequest<any>("/admin/moderation/stats", { token });
  },

  /**
   * Get reporter's history
   */
  async getReporterHistory(
    token: string,
    reporterId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return apiRequest<any>(
      `/admin/moderation/reporters/${reporterId}?${params.toString()}`,
      { token },
    );
  },

  /**
   * Get submissions for review
   */
  async getSubmissionsForReview(
    token: string,
    limit: number = 50,
    offset: number = 0,
    status?: "PENDING" | "APPROVED" | "REJECTED",
  ) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (status) params.append("status", status);

    return apiRequest<any>(
      `/admin/moderation/submissions?${params.toString()}`,
      { token },
    );
  },

  /**
   * Update submission status
   */
  async updateSubmissionStatus(
    token: string,
    submissionId: string,
    status: "PENDING" | "APPROVED" | "REJECTED",
    rejectionReason?: string,
  ) {
    return apiRequest<any>(`/admin/moderation/submissions/${submissionId}`, {
      token,
      method: "PATCH",
      body: { status, rejectionReason },
    });
  },
};

// ============================================================================
// LEADERBOARD ADMIN API
// ============================================================================

export const leaderboardAdminAPI = {
  /**
   * Get global leaderboard with top users
   */
  async getLeaderboard(token: string, limit: number = 100) {
    return apiRequest<{
      leaderboard: Array<{
        id: string;
        userId: string;
        totalXp: number;
        rank: number;
        streakRecord: number;
        lessonsCompleted: number;
        charactersCollected: number;
        gamesWon: number;
        user: {
          id: string;
          username: string;
          avatar?: string;
          language?: string;
        };
      }>;
    }>(`/leaderboard/?limit=${limit}`, { token });
  },

  /**
   * Get specific user's leaderboard stats and ranking
   */
  async getUserStats(token: string, userId: string) {
    return apiRequest<{
      user: {
        id: string;
        username: string;
        avatar?: string;
      };
      stats: {
        totalXp: number;
        rank: number;
        percentile: number;
        streakRecord: number;
        lessonsCompleted: number;
        charactersCollected: number;
        gamesWon: number;
      };
    }>(`/admin/leaderboard/users/${userId}`, { token });
  },

  /**
   * Export leaderboard data
   */
  async exportLeaderboard(token: string, format: "csv" | "json" = "csv") {
    return apiRequest<{
      data: string;
      filename: string;
    }>(`/admin/leaderboard/export?format=${format}`, { token });
  },

  /**
   * Get leaderboard statistics and trends
   */
  async getStatistics(token: string) {
    return apiRequest<{
      totalUsers: number;
      averageXp: number;
      topUserXp: number;
      averageStreak: number;
      xpDistribution: Record<string, number>;
      activityTrends: Array<{ date: string; activeUsers: number }>;
    }>(`/admin/leaderboard/statistics`, { token });
  },

  /**
   * Reset leaderboard (use with caution)
   */
  async resetLeaderboard(token: string) {
    return apiRequest<{ message: string }>(`/admin/leaderboard/reset`, {
      token,
      method: "POST",
    });
  },
};

// ============================================================================
// COLLECTIONS ADMIN API
// ============================================================================

export const collectionsAdminAPI = {
  /**
   * Get all collections across users (admin view)
   */
  async getAllCollections(
    token: string,
    filters?: {
      userId?: string;
      isPublic?: boolean;
      limit?: number;
      offset?: number;
    },
  ) {
    const params = new URLSearchParams();
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.isPublic !== undefined)
      params.append("isPublic", filters.isPublic.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    return apiRequest<{
      collections: Array<{
        id: string;
        userId: string;
        user: { id: string; username: string; avatar?: string };
        title: string;
        description?: string;
        isPublic: boolean;
        itemCount: number;
        createdAt: string;
        updatedAt: string;
      }>;
      total: number;
    }>(`/admin/collections?${params.toString()}`, { token });
  },

  /**
   * Get collection details with all items
   */
  async getCollectionDetails(token: string, collectionId: string) {
    return apiRequest<{
      id: string;
      userId: string;
      user: { id: string; username: string; avatar?: string };
      title: string;
      description?: string;
      isPublic: boolean;
      items: Array<{
        id: string;
        lesson: {
          id: string;
          title: string;
          slug: string;
          coverImage?: string;
        };
        order: number;
        addedAt: string;
      }>;
      createdAt: string;
      updatedAt: string;
    }>(`/admin/collections/${collectionId}`, { token });
  },

  /**
   * Get public collections for curation
   */
  async getPublicCollections(token: string, limit: number = 50) {
    return apiRequest<{
      collections: Array<{
        id: string;
        userId: string;
        user: { id: string; username: string };
        title: string;
        description?: string;
        itemCount: number;
        createdAt: string;
      }>;
      total: number;
    }>(`/admin/collections/public?limit=${limit}`, { token });
  },

  /**
   * Delete a collection
   */
  async deleteCollection(token: string, collectionId: string) {
    return apiRequest<{ message: string }>(
      `/admin/collections/${collectionId}`,
      {
        token,
        method: "DELETE",
      },
    );
  },

  /**
   * Get collection analytics
   */
  async getAnalytics(token: string) {
    return apiRequest<{
      totalCollections: number;
      publicCollections: number;
      averageItemsPerCollection: number;
      mostPopularCollections: Array<{
        id: string;
        title: string;
        itemCount: number;
        createdBy: string;
      }>;
      creationTrends: Array<{ date: string; collectionsCreated: number }>;
    }>(`/admin/collections/analytics`, { token });
  },
};

// ==================== Character Collections Admin ====================

/**
 * Get all character collections for admin
 */
export async function getCharacterCollections(
  token: string,
): Promise<AdminCharacterCollectionSummary[]> {
  const data = await apiRequest<{
    collections: AdminCharacterCollectionSummary[];
  }>("/content/admin/character-collections", { token });
  return data.collections;
}

/**
 * Get single character collection with all characters
 */
export async function getCharacterCollection(
  token: string,
  collectionId: string,
): Promise<AdminCharacterCollectionDetail> {
  const data = await apiRequest<{ collection: AdminCharacterCollectionDetail }>(
    `/content/admin/character-collections/${collectionId}`,
    { token },
  );
  return data.collection;
}

/**
 * Create a new character collection
 */
export async function createCharacterCollection(
  token: string,
  payload: {
    name: string;
    description?: string;
    coverImage?: string;
    order?: number;
    characterIds: string[];
  },
): Promise<AdminCharacterCollectionSummary> {
  const data = await apiRequest<{
    collection: AdminCharacterCollectionSummary;
  }>("/content/admin/character-collections", {
    token,
    method: "POST",
    body: payload,
  });
  return data.collection;
}

/**
 * Update a character collection
 */
export async function updateCharacterCollection(
  token: string,
  collectionId: string,
  payload: {
    name?: string;
    description?: string;
    coverImage?: string;
    order?: number;
    characterIds?: string[];
  },
): Promise<AdminCharacterCollectionSummary> {
  const data = await apiRequest<{
    collection: AdminCharacterCollectionSummary;
  }>(`/content/admin/character-collections/${collectionId}`, {
    token,
    method: "PATCH",
    body: payload,
  });
  return data.collection;
}

/**
 * Delete a character collection
 */
export async function deleteCharacterCollection(
  token: string,
  collectionId: string,
): Promise<void> {
  await apiRequest<void>(
    `/content/admin/character-collections/${collectionId}`,
    {
      token,
      method: "DELETE",
    },
  );
}

// ============================================================================
// COMMUNITY ADMIN API
// ============================================================================

export const communityAdminAPI = {
  /**
   * Get all comments with optional filtering
   */
  async getAllComments(
    token: string,
    filters?: {
      lessonId?: string;
      userId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const params = new URLSearchParams();
    if (filters?.lessonId) params.append("lessonId", filters.lessonId);
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    return apiRequest<{
      comments: Array<{
        id: string;
        userId: string;
        user: { id: string; username: string; avatar?: string };
        lessonId: string;
        lesson: { id: string; title: string };
        content: string;
        likes: number;
        createdAt: string;
        updatedAt: string;
        flagged?: boolean;
        flagReason?: string;
      }>;
      total: number;
    }>(`/admin/community/comments?${params.toString()}`, { token });
  },

  /**
   * Delete a comment
   */
  async deleteComment(token: string, commentId: string) {
    return apiRequest<{ message: string }>(
      `/admin/community/comments/${commentId}`,
      {
        token,
        method: "DELETE",
      },
    );
  },

  /**
   * Flag comment as inappropriate
   */
  async flagComment(token: string, commentId: string, reason: string) {
    return apiRequest<{ message: string }>(
      `/admin/community/comments/${commentId}/flag`,
      {
        token,
        method: "POST",
        body: { reason },
      },
    );
  },

  /**
   * Get comment statistics
   */
  async getStatistics(token: string) {
    return apiRequest<{
      totalComments: number;
      totalFlaggedComments: number;
      averageLikesPerComment: number;
      mostActiveUsers: Array<{
        userId: string;
        username: string;
        commentCount: number;
      }>;
      trendingLessons: Array<{
        lessonId: string;
        title: string;
        commentCount: number;
      }>;
    }>(`/admin/community/statistics`, { token });
  },

  /**
   * Get flagged/reported comments
   */
  async getFlaggedComments(
    token: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return apiRequest<{
      comments: Array<{
        id: string;
        userId: string;
        user: { id: string; username: string };
        content: string;
        flagReason: string;
        createdAt: string;
      }>;
      total: number;
    }>(`/admin/community/flagged?limit=${limit}&offset=${offset}`, {
      token,
    });
  },

  /**
   * Get lesson discussion overview
   */
  async getLessonDiscussion(token: string, lessonId: string) {
    return apiRequest<{
      lessonId: string;
      lessonTitle: string;
      totalComments: number;
      topContributors: Array<{
        userId: string;
        username: string;
        commentCount: number;
      }>;
      recentComments: Array<{
        id: string;
        user: { id: string; username: string };
        content: string;
        likes: number;
        createdAt: string;
      }>;
    }>(`/admin/community/lessons/${lessonId}/discussion`, { token });
  },
};

// ============================================================================
// SOCIAL ADMIN API
// ============================================================================

export const socialAdminAPI = {
  /**
   * Get follower/following network graph
   */
  async getFollowingGraph(token: string, userId: string) {
    return apiRequest<{
      user: { id: string; username: string; avatar?: string };
      followerCount: number;
      followingCount: number;
      followers: Array<{ id: string; username: string; avatar?: string }>;
      following: Array<{ id: string; username: string; avatar?: string }>;
    }>(`/admin/social/users/${userId}/graph`, { token });
  },

  /**
   * Get most bookmarked lessons
   */
  async getMostBookmarkedLessons(token: string, limit: number = 50) {
    return apiRequest<{
      lessons: Array<{
        lessonId: string;
        lesson: {
          id: string;
          title: string;
          slug: string;
        };
        bookmarkCount: number;
        lastBookmarkedAt: string;
      }>;
    }>(`/admin/social/bookmarks/top?limit=${limit}`, { token });
  },

  /**
   * Get user connection statistics
   */
  async getConnectionStatistics(token: string) {
    return apiRequest<{
      totalUsers: number;
      usersWithFollowers: number;
      averageFollowers: number;
      averageFollowing: number;
      networkDensity: number;
      mostFollowedUsers: Array<{
        userId: string;
        username: string;
        followerCount: number;
      }>;
      totalBookmarks: number;
      averageBookmarksPerUser: number;
    }>(`/admin/social/statistics`, { token });
  },

  /**
   * Get all bookmarks
   */
  async getAllBookmarks(
    token: string,
    filters?: {
      userId?: string;
      lessonId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const params = new URLSearchParams();
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.lessonId) params.append("lessonId", filters.lessonId);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    return apiRequest<{
      bookmarks: Array<{
        id: string;
        userId: string;
        user: { id: string; username: string };
        lessonId: string;
        lesson: { id: string; title: string };
        createdAt: string;
      }>;
      total: number;
    }>(`/admin/social/bookmarks?${params.toString()}`, { token });
  },

  /**
   * Detect suspicious follow patterns
   */
  async getSuspiciousPatterns(token: string) {
    return apiRequest<{
      patterns: Array<{
        userId: string;
        username: string;
        pattern: string;
        followingCount: number;
        followerCount: number;
        ratio: number;
        riskScore: number;
      }>;
    }>(`/admin/social/suspicious-patterns`, { token });
  },
};

// ============================================================================
// NOTIFICATIONS ADMIN API
// ============================================================================

export const notificationsAdminAPI = {
  /**
   * Send global announcement to all users
   */
  async sendGlobalNotification(
    token: string,
    payload: {
      title: string;
      message: string;
      data?: Record<string, any>;
    },
  ) {
    return apiRequest<{
      message: string;
      recipientCount: number;
    }>(`/admin/notifications/broadcast`, {
      token,
      method: "POST",
      body: payload,
    });
  },

  /**
   * Send targeted notifications to specific users
   */
  async sendTargetedNotification(
    token: string,
    userIds: string[],
    payload: {
      type: string;
      title: string;
      message: string;
      data?: Record<string, any>;
    },
  ) {
    return apiRequest<{
      message: string;
      sentCount: number;
      failedCount: number;
    }>(`/admin/notifications/send`, {
      token,
      method: "POST",
      body: { userIds, ...payload },
    });
  },

  /**
   * Get notification logs
   */
  async getNotificationLogs(
    token: string,
    filters?: {
      userId?: string;
      type?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const params = new URLSearchParams();
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    return apiRequest<{
      logs: Array<{
        id: string;
        userId: string;
        user: { id: string; username: string };
        type: string;
        title: string;
        message: string;
        read: boolean;
        createdAt: string;
      }>;
      total: number;
    }>(`/admin/notifications/logs?${params.toString()}`, { token });
  },

  /**
   * Get notification statistics
   */
  async getStatistics(token: string) {
    return apiRequest<{
      totalNotifications: number;
      readNotifications: number;
      unreadNotifications: number;
      readRate: number;
      byType: Record<string, number>;
      engagement: {
        day: number[];
        week: number[];
        month: number[];
      };
    }>(`/admin/notifications/statistics`, { token });
  },

  /**
   * Schedule a notification
   */
  async scheduleNotification(
    token: string,
    payload: {
      userIds: string[];
      type: string;
      title: string;
      message: string;
      data?: Record<string, any>;
      scheduledAt: string; // ISO date string
    },
  ) {
    return apiRequest<{
      id: string;
      message: string;
      scheduledAt: string;
    }>(`/admin/notifications/schedule`, {
      token,
      method: "POST",
      body: payload,
    });
  },

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications(token: string) {
    return apiRequest<{
      notifications: Array<{
        id: string;
        title: string;
        message: string;
        recipientCount: number;
        scheduledAt: string;
        status: "pending" | "sent";
      }>;
    }>(`/admin/notifications/scheduled`, { token });
  },

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(token: string, notificationId: string) {
    return apiRequest<{ message: string }>(
      `/admin/notifications/scheduled/${notificationId}`,
      {
        token,
        method: "DELETE",
      },
    );
  },

  /**
   * Get push token statistics
   */
  async getPushTokenStats(token: string) {
    return apiRequest<{
      totalTokens: number;
      byPlatform: { ios: number; android: number };
      activeTokens: number;
      inactiveTokens: number;
    }>(`/admin/notifications/tokens/stats`, { token });
  },
};

// ============================================================================
// PROGRESS ADMIN API
// ============================================================================

export const progressAdminAPI = {
  /**
   * Get user's learning progress
   */
  async getUserProgress(token: string, userId: string) {
    return apiRequest<{
      userId: string;
      user: { id: string; username: string };
      lessonsStarted: number;
      lessonsCompleted: number;
      currentLesson?: {
        id: string;
        title: string;
        currentPosition?: number;
      };
      averageCompletionTime?: number;
      readingGoal?: {
        dailyMinutes: number;
        achieved: number;
        compliance: number;
      };
      dailyActivity: Array<{
        date: string;
        minutesRead: number;
        goalMet: boolean;
      }>;
    }>(`/admin/progress/users/${userId}`, { token });
  },

  /**
   * Get course completion statistics
   */
  async getCourseCompletionStats(token: string) {
    return apiRequest<{
      totalUsers: number;
      usersWithProgress: number;
      averageProgressPercentage: number;
      completionByLesson: Array<{
        lessonId: string;
        title: string;
        completions: number;
        completionRate: number;
        averageTimeSpent: number; // in minutes
      }>;
      difficultyAnalysis: Record<
        string,
        {
          lessonCount: number;
          averageCompletionRate: number;
          averageTimeSpent: number;
        }
      >;
    }>(`/admin/progress/completion-stats`, { token });
  },

  /**
   * Get daily active users
   */
  async getDailyActiveUsers(
    token: string,
    dateRange?: {
      start: string;
      end: string;
    },
  ) {
    const params = new URLSearchParams();
    if (dateRange?.start) params.append("start", dateRange.start);
    if (dateRange?.end) params.append("end", dateRange.end);

    return apiRequest<{
      data: Array<{
        date: string;
        activeUsers: number;
        lessonsCompleted: number;
        averageSessionDuration: number;
      }>;
    }>(`/admin/progress/daily-active?${params.toString()}`, { token });
  },

  /**
   * Get reading goal compliance statistics
   */
  async getReadingGoalCompliance(token: string) {
    return apiRequest<{
      totalUsersWithGoal: number;
      usersMetGoal: number;
      complianceRate: number;
      averageDailyMinutes: number;
      complianceByDay: Record<string, number>;
      topPerformers: Array<{
        userId: string;
        username: string;
        daysMetGoal: number;
        totalMinutes: number;
      }>;
    }>(`/admin/progress/reading-compliance`, { token });
  },

  /**
   * Get learning path analytics
   */
  async getLearningPathAnalytics(token: string) {
    return apiRequest<{
      paths: Array<{
        category?: string;
        lessonsInPath: number;
        averageTimeToComplete: number;
        completionRate: number;
        usersOnPath: number;
        dropoffLessons: Array<{
          lessonId: string;
          title: string;
          dropoffRate: number;
        }>;
      }>;
    }>(`/admin/progress/learning-paths`, { token });
  },

  /**
   * Export user progress report
   */
  async exportUserProgressReport(
    token: string,
    userId: string,
    format: "csv" | "json" | "pdf" = "pdf",
  ) {
    return apiRequest<{
      data: string;
      filename: string;
    }>(`/admin/progress/export/${userId}?format=${format}`, { token });
  },

  /**
   * Get learning time heatmap (when users are most active)
   */
  async getLearningTimeHeatmap(token: string) {
    return apiRequest<{
      hourlyActivity: Record<number, number>; // hour -> count
      daylyActivity: Record<string, number>; // day of week -> count
      peakHours: number[];
      peakDays: string[];
    }>(`/admin/progress/heatmap`, { token });
  },

  /**
   * Get user retention statistics
   */
  async getRetentionStatistics(token: string) {
    return apiRequest<{
      dayOneRetention: number;
      weekOneRetention: number;
      monthOneRetention: number;
      cohortRetention: Array<{
        cohortDate: string;
        retentionRates: Record<string, number>;
      }>;
    }>(`/admin/progress/retention`, { token });
  },

  /**
   * Get lesson difficulty vs completion analysis
   */
  async getLessonDifficultyAnalysis(token: string) {
    return apiRequest<{
      byDifficulty: Record<
        string,
        {
          lessonCount: number;
          averageCompletionRate: number;
          averageTimeSpent: number;
          abandonmentRate: number;
        }
      >;
    }>(`/admin/progress/difficulty-analysis`, { token });
  },
};

// ========================
// GAMIFICATION ADMIN API
// ========================

/**
 * Get hearts statistics
 */
export async function getHeartsStats(token: string): Promise<any> {
  return apiRequest<any>("/admin/gamification/hearts/stats", { token });
}

/**
 * Get hearts data with pagination
 */
export async function getHeartsData(
  token: string,
  limit: number = 50,
  offset: number = 0,
  sortBy: string = "hearts",
  order: string = "desc",
): Promise<any> {
  return apiRequest<any>(
    `/admin/gamification/hearts?limit=${limit}&offset=${offset}&sortBy=${sortBy}&order=${order}`,
    { token },
  );
}

/**
 * Restore hearts for a specific user
 */
export async function restoreUserHearts(
  token: string,
  userId: string,
  hearts: number,
): Promise<any> {
  return apiRequest<any>(`/admin/gamification/hearts/${userId}/restore`, {
    token,
    method: "POST",
    body: { hearts },
  });
}

/**
 * Bulk restore all users' hearts
 */
export async function bulkRestoreHearts(
  token: string,
  hearts: number,
): Promise<any> {
  return apiRequest<any>("/admin/gamification/hearts/restore-all", {
    token,
    method: "POST",
    body: { hearts },
  });
}

/**
 * Sync all hearts with settings
 */
export async function syncAllHearts(token: string): Promise<any> {
  return apiRequest<any>("/admin/gamification/hearts/sync", {
    token,
    method: "POST",
  });
}

/**
 * Get streaks statistics
 */
export async function getStreaksStats(token: string): Promise<any> {
  return apiRequest<any>("/admin/gamification/streaks/stats", { token });
}

/**
 * Get streaks data with pagination
 */
export async function getStreaksData(
  token: string,
  limit: number = 50,
  offset: number = 0,
  sortBy: string = "current",
  order: string = "desc",
): Promise<any> {
  return apiRequest<any>(
    `/admin/gamification/streaks?limit=${limit}&offset=${offset}&sortBy=${sortBy}&order=${order}`,
    { token },
  );
}

/**
 * Reset a user's streak
 */
export async function resetUserStreak(
  token: string,
  userId: string,
): Promise<any> {
  return apiRequest<any>(`/admin/gamification/streaks/${userId}/reset`, {
    token,
    method: "POST",
  });
}

/**
 * Award XP to a user's streak
 */
export async function awardStreakXp(
  token: string,
  userId: string,
  xpAmount: number,
  reason: string,
): Promise<any> {
  return apiRequest<any>(`/admin/gamification/streaks/${userId}/award-xp`, {
    token,
    method: "POST",
    body: { xpAmount, reason },
  });
}

/**
 * Freeze a user's streak
 */
export async function freezeUserStreak(
  token: string,
  userId: string,
): Promise<any> {
  return apiRequest<any>(`/admin/gamification/streaks/${userId}/freeze`, {
    token,
    method: "POST",
  });
}

/**
 * Get characters statistics
 */
export async function getCharactersStats(token: string): Promise<any> {
  return apiRequest<any>("/admin/gamification/characters/stats", { token });
}

/**
 * Get events list
 */
export async function getGameEvents(token: string): Promise<any> {
  return apiRequest<any>("/admin/gamification/events", { token });
}

/**
 * Create a game event
 */
export async function createGameEvent(
  token: string,
  data: {
    eventName: string;
    multiplier: number;
    durationHours: number;
    affectedSystem: string;
  },
): Promise<any> {
  return apiRequest<any>("/admin/gamification/events", {
    token,
    method: "POST",
    body: data,
  });
}

/**
 * Delete a game event
 */
export async function deleteGameEvent(
  token: string,
  eventId: string,
): Promise<any> {
  return apiRequest<any>(`/admin/gamification/events/${eventId}`, {
    token,
    method: "DELETE",
  });
}

/**
 * Get gamification configuration
 */
export async function getGamificationConfig(token: string): Promise<any> {
  return apiRequest<any>("/admin/gamification/config", { token });
}

/**
 * Update gamification configuration
 */
export async function updateGamificationConfig(
  token: string,
  config: any,
): Promise<any> {
  return apiRequest<any>("/admin/gamification/config", {
    token,
    method: "PUT",
    body: config,
  });
}
