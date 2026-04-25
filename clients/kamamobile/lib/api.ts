import Constants from "expo-constants";

// ==================== Types ====================

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  avatar?: string | null;
  role?: string;
  language?: string | null;
  xp?: number;
  streak?: number;
  offlineEnabled?: boolean;
  createdAt?: string;
};

export type AuthResponse = {
  token: string;
  expiresAt: string;
  user: UserProfile;
};

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export type Topic = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  parentId?: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  icon?: string | null;
  lessonCount: number;
  characterCount: number;
  totalChapters: number;
};

export type Character = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string | null;
  rarityLevel?: string | null;
  story?: string;
  xpThreshold?: number | null;
  unlockLesson?: {
    id: string;
    slug: string;
  } | null;
  entityType?: string | null;
  personType?: string | null;
  placeType?: string | null;
  eventType?: string | null;
  traditionType?: string | null;
  conceptType?: string | null;
  metadata?: Record<string, unknown> | null;
  birthYear?: number | null;
  endYear?: number | null;
  country?: string | null;
  achievements?: string[] | null;
  categories?: Array<{
    category: {
      id: string;
      slug: string;
      name: string;
    };
  }>;
  lessons?: Array<{
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    order: number;
  }>;
};

export type CharacterInCollection = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  rarityLevel?: string | null;
};

export type CharacterCollection = {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  characterCount: number;
  characters?: CharacterInCollection[] | null;
};

export type HeartState = {
  hearts: number;
  maxHearts: number;
  lastHeartLossAt?: string | null;
  lastRecoveredAt?: string | null;
  recoveryTimeMs?: number;
  nextRecoveryAt?: string | null;
  willRecover?: boolean;
  timeUntilNextHeartMs?: number;
  isPremium?: boolean;
};

export type StreakState = {
  currentStreak: number;
  longestStreak?: number;
  lastCheckInDate?: string | null;
  freezeCount?: number;
};

export type DashboardData = {
  hearts: HeartState;
  streak: StreakState;
  characters: unknown[];
  stats: unknown;
};

export type MatchSummary = {
  id: string;
  status: "WAITING" | "IN_PROGRESS" | "FINISHED";
  topicId?: string | null;
  player1Id: string;
  player2Id?: string | null;
};

export type LessonSummary = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  hook?: string | null;
  coverImage?: string | null;
  xpReward?: number;
};

export type LessonQuiz = {
  id: string;
  topicId?: string | null;
};

export type TopicQuiz = {
  id: string;
  topicId?: string | null;
  lessonId: string;
  order: number;
};

export type LessonDetail = {
  id: string;
  topic?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  quizzes: LessonQuiz[];
};

export type LessonChapter = {
  steps: any;
  id: string;
  title: string;
  order: number;
  content?: string;
};

/** Raw quiz row from GET /content/lessons/slug/:slug — options/optionImages are Json */
export type LessonQuizQuestion = {
  id: string;
  chapterId?: string | null;
  type?: string | null;
  question: string;
  options: unknown;
  optionImages?: unknown;
  explanation?: string | null;
  isPoll?: boolean;
  pollDescription?: string | null;
};

export type LessonFull = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  hook?: string | null;
  content?: string;
  coverImage?: string | null;
  xpReward: number;
  chapters: LessonChapter[];
  quizzes: LessonQuizQuestion[];
};

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

// ==================== Core API ====================

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  token?: string | null;
  body?: unknown;
  quietErrorStatuses?: number[];
};

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;

console.log("[API Client] Configured API_BASE_URL:", API_BASE_URL);

async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const fullUrl = `${API_BASE_URL}${path}`;
  console.log(`[API Request] ${options.method ?? "GET"} ${fullUrl}`);

  const response = await fetch(fullUrl, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let body: unknown;
    try {
      body = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = (body as any)?.error ?? (body as any)?.message ?? message;
    } catch {
      // ignore invalid response payload
    }
    const shouldLogError = !options.quietErrorStatuses?.includes(
      response.status,
    );
    if (shouldLogError) {
      console.error(
        `[API Error] ${fullUrl}: ${response.status} - ${message}`,
        body,
      );
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// ==================== Auth ====================

export async function loginWithEmail(input: {
  email: string;
  password: string;
  language?: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/email", {
    method: "POST",
    body: input,
  });
}

export async function registerWithEmail(input: {
  username: string;
  email: string;
  password: string;
  language?: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export async function loginWithGoogle(input: {
  idToken: string;
  accessToken: string;
  language?: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/google", {
    method: "POST",
    body: input,
  });
}

export async function getMe(token: string): Promise<UserProfile> {
  const response = await apiRequest<{ user: UserProfile }>("/auth/me", {
    token,
    quietErrorStatuses: [401],
  });
  return response.user;
}

export async function logout(token: string): Promise<void> {
  await apiRequest<void>("/auth/logout", {
    method: "POST",
    token,
    quietErrorStatuses: [401],
  });
}

// ==================== Content ====================

export async function getCategories(language?: string): Promise<Category[]> {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const response = await apiRequest<{ categories: Category[] }>(
    `/content/categories${query}`,
  );
  return response.categories;
}

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

export async function getCharacterBySlug(
  slug: string,
  language?: string,
): Promise<Character> {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const response = await apiRequest<{ character: Character }>(
    `/content/characters/slug/${slug}${query}`,
  );
  return response.character;
}

export async function getCharacterCollections(): Promise<
  CharacterCollection[]
> {
  const response = await apiRequest<{ collections: CharacterCollection[] }>(
    "/content/character-collections",
  );
  return response.collections;
}

export async function getCharacterCollection(
  collectionId: string,
): Promise<CharacterCollection> {
  const response = await apiRequest<{ collection: CharacterCollection }>(
    `/content/character-collections/${collectionId}`,
  );
  return response.collection;
}

export async function getLessons(language?: string): Promise<LessonSummary[]> {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const response = await apiRequest<{ lessons: LessonSummary[] }>(
    `/content/lessons${query}`,
  );
  return response.lessons;
}

export async function getLesson(
  lessonId: string,
  language?: string,
): Promise<LessonDetail> {
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
  pollId: string,
  selectedOption: number,
): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/content/polls/${pollId}/vote`, {
    method: "POST",
    token,
    body: { selectedOption },
  });
}

export async function submitAudioPollVote(
  token: string,
  pollId: string,
  selectedOption: number,
): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/content/audio-polls/${pollId}/vote`, {
    method: "POST",
    token,
    body: { selectedOption },
  });
}

// ==================== Gamification ====================

export async function getHearts(token: string): Promise<HeartState> {
  const response = await apiRequest<ApiEnvelope<HeartState>>(
    "/gamification/hearts",
    {
      token,
    },
  );
  return response.data;
}

export async function getStreak(token: string): Promise<StreakState> {
  const response = await apiRequest<ApiEnvelope<StreakState>>(
    "/gamification/streaks",
    { token },
  );
  return response.data;
}

export async function getDashboard(token: string): Promise<DashboardData> {
  const response = await apiRequest<ApiEnvelope<DashboardData>>(
    "/gamification/dashboard",
    { token },
  );
  return response.data;
}

// ==================== Progress ====================

export async function completeLesson(
  token: string,
  lessonId: string,
): Promise<{
  ok: boolean;
  xpEarned: number;
  alreadyCompleted: boolean;
}> {
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
): Promise<{ ok: boolean }> {
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

// ==================== Game ====================

export async function quickPlayMatch(input: {
  token: string;
  quizPool: string[];
  topicId?: string;
  maxRounds?: number;
}): Promise<{ isNew: boolean; match: MatchSummary }> {
  const { token, ...body } = input;
  return apiRequest<{ isNew: boolean; match: MatchSummary }>(
    "/game/matches/quickplay",
    {
      method: "POST",
      token,
      body,
    },
  );
}

// ==================== Quiz ====================

export async function startQuizSession(
  token: string,
  quizId: string,
): Promise<{ sessionId: string }> {
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
): Promise<{
  attempt?: { isCorrect: boolean };
  heartsRemaining: number;
  completedAt: string | null;
  passed: boolean | null;
  heartState?: HeartState;
}> {
  return apiRequest<{
    attempt?: { isCorrect: boolean };
    heartsRemaining: number;
    completedAt: string | null;
    passed: boolean | null;
    heartState?: HeartState;
  }>(`/quiz/sessions/${sessionId}/answer`, {
    method: "POST",
    token,
    body: { selectedOption },
  });
}

// ==================== Feedback ====================

export async function submitLessonFeedback(input: {
  token: string;
  lessonId: string;
  rating: number;
  comment?: string;
}): Promise<{
  feedback: { id: string; rating: number; comment?: string };
}> {
  const { token, lessonId, rating, comment } = input;
  return apiRequest<{
    feedback: { id: string; rating: number; comment?: string };
  }>(`/feedback/lessons/${lessonId}`, {
    method: "POST",
    token,
    body: { rating, comment },
  });
}
