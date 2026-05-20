import AsyncStorage from "@react-native-async-storage/async-storage";

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

export type LessonInCollection = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  xpReward?: number | null;
};

export type LessonCollection = {
  id: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  lessons?: LessonInCollection[] | null;
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
  lastActivityAt?: string | null;
  streakStartedAt?: string | null;
  isActive?: boolean;
  daysUntilLoss?: number;
  canFreezeStreak?: boolean;
  freezesRemaining?: number;
  streakFrozenUntil?: string | null;
};

export type DashboardCharacterProgress = {
  characterId: string;
  isUnlocked: boolean;
  unlockedAt?: string | null;
  isFavorite?: boolean;
  collectionLevel?: number;
};

export type DashboardStats = {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  totalXpEarned: number;
  totalLessonsCompleted: number;
  totalQuizzesCompleted: number;
  lastActivityAt?: string | null;
  streakStartedAt?: string | null;
};

export type DashboardData = {
  hearts: HeartState;
  streak: StreakState;
  characters: DashboardCharacterProgress[];
  stats: DashboardStats;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon?: string | null;
  xpRequired?: number | null;
  streakRequired?: number | null;
  createdAt?: string;
};

export type EarnedAchievement = {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: string;
  achievement: Achievement;
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

export type RoadmapLevel = {
  id: string;
  title: string;
  description?: string | null;
  symbol?: string | null;
  color?: string | null;
  order: number;
  lessons: Array<LessonSummary & { order: number; isPremium?: boolean }>;
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
  coverImage?: string | null;
};

/** Raw quiz row from GET /content/lessons/slug/:slug — options/optionImages are Json */
export type LessonQuizQuestion = {
  id: string;
  chapterId?: string | null;
  type?: string | null;
  question: string;
  options: unknown;
  optionImages?: unknown;
  correctOption?: number | null;
  explanation?: string | null;
  isPoll?: boolean;
  pollDescription?: string | null;
};

export type LessonFull = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
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
  cache?: {
    key: string;
    ttlMs: number;
  };
};

const apiMemoryCache = new Map<string, { savedAt: number; data: unknown }>();

function getTokenCachePart(token?: string | null) {
  return token ? token.slice(-12) : "public";
}

function getApiCacheKey(key: string, token?: string | null) {
  return `kama:api:v1:${getTokenCachePart(token)}:${key}`;
}

async function readApiCache<T>(key: string, ttlMs: number) {
  const now = Date.now();
  const memoryEntry = apiMemoryCache.get(key);

  if (memoryEntry && now - memoryEntry.savedAt < ttlMs) {
    return memoryEntry.data as T;
  }

  try {
    const rawValue = await AsyncStorage.getItem(key);
    if (!rawValue) return null;
    const entry = JSON.parse(rawValue) as { savedAt?: number; data?: T };
    if (!entry.savedAt || entry.data === undefined) return null;
    if (now - entry.savedAt >= ttlMs) return null;

    apiMemoryCache.set(key, { savedAt: entry.savedAt, data: entry.data });
    return entry.data;
  } catch {
    return null;
  }
}

async function writeApiCache(key: string, data: unknown) {
  const entry = { savedAt: Date.now(), data };
  apiMemoryCache.set(key, entry);

  try {
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Persistent API cache is an optimization only.
  }
}

async function clearApiCacheByPrefix(prefix: string) {
  for (const key of apiMemoryCache.keys()) {
    if (key.startsWith(prefix)) {
      apiMemoryCache.delete(key);
    }
  }

  try {
    const keys = await AsyncStorage.getAllKeys();
    const matchingKeys = keys.filter((key) => key.startsWith(prefix));
    if (matchingKeys.length > 0) {
      await AsyncStorage.multiRemove(matchingKeys);
    }
  } catch {
    // Cache invalidation should never break the foreground action.
  }
}

export async function clearUserDataCache(token?: string | null) {
  await clearApiCacheByPrefix(
    `kama:api:v1:${getTokenCachePart(token ?? null)}:`,
  );
}

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
  const cacheKey =
    options.cache && (options.method ?? "GET") === "GET"
      ? getApiCacheKey(options.cache.key, options.token)
      : null;

  if (cacheKey && options.cache) {
    const cachedValue = await readApiCache<T>(cacheKey, options.cache.ttlMs);
    if (cachedValue) {
      return cachedValue;
    }
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    if (cacheKey) {
      const staleValue = apiMemoryCache.get(cacheKey)?.data as T | undefined;
      if (staleValue) return staleValue;
    }
    throw error;
  }

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

  const data = (await response.json()) as T;
  if (cacheKey) {
    await writeApiCache(cacheKey, data);
  }
  return data;
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
    {
      cache: {
        key: `categories:${language ?? "default"}`,
        ttlMs: 1000 * 60 * 30,
      },
    },
  );
  return response.categories;
}

export async function getTopics(): Promise<Topic[]> {
  const response = await apiRequest<{ topics: Topic[] }>("/content/topics", {
    cache: { key: "topics", ttlMs: 1000 * 60 * 30 },
  });
  return response.topics;
}

export async function getCharacters(language?: string): Promise<Character[]> {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const response = await apiRequest<{ characters: Character[] }>(
    `/content/characters${query}`,
    {
      cache: {
        key: `characters:${language ?? "default"}`,
        ttlMs: 1000 * 60 * 30,
      },
    },
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
    {
      cache: {
        key: `character:${language ?? "default"}:${slug}`,
        ttlMs: 1000 * 60 * 30,
      },
    },
  );
  return response.character;
}

export async function getCharacterCollections(): Promise<
  CharacterCollection[]
> {
  const response = await apiRequest<{ collections: CharacterCollection[] }>(
    "/content/character-collections",
    {
      cache: { key: "character-collections", ttlMs: 1000 * 60 * 30 },
    },
  );
  return response.collections;
}

export async function getCharacterCollection(
  collectionId: string,
): Promise<CharacterCollection> {
  const response = await apiRequest<{ collection: CharacterCollection }>(
    `/content/character-collections/${collectionId}`,
    {
      cache: {
        key: `character-collection:${collectionId}`,
        ttlMs: 1000 * 60 * 30,
      },
    },
  );
  return response.collection;
}

export async function getLessonCollections(): Promise<LessonCollection[]> {
  const response = await apiRequest<{ collections: LessonCollection[] }>(
    "/content/lesson-collections",
    {
      cache: { key: "lesson-collections", ttlMs: 1000 * 60 * 30 },
    },
  );
  return response.collections;
}

export async function getLessonCollection(
  collectionId: string,
): Promise<LessonCollection> {
  const response = await apiRequest<{ collection: LessonCollection }>(
    `/content/lesson-collections/${collectionId}`,
    {
      cache: {
        key: `lesson-collection:${collectionId}`,
        ttlMs: 1000 * 60 * 30,
      },
    },
  );
  return response.collection;
}

export async function getLessons(language?: string): Promise<LessonSummary[]> {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const response = await apiRequest<{ lessons: LessonSummary[] }>(
    `/content/lessons${query}`,
    {
      cache: {
        key: `lessons:${language ?? "default"}`,
        ttlMs: 1000 * 60 * 15,
      },
    },
  );
  return response.lessons;
}

export async function getRoadmap(language?: string): Promise<RoadmapLevel[]> {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const response = await apiRequest<{ levels: RoadmapLevel[] }>(
    `/content/roadmap${query}`,
    {
      cache: {
        key: `roadmap:${language ?? "default"}`,
        ttlMs: 1000 * 60 * 15,
      },
    },
  );
  return response.levels;
}

export async function getLesson(
  lessonId: string,
  language?: string,
): Promise<LessonDetail> {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const response = await apiRequest<{ lesson: LessonDetail }>(
    `/content/lessons/${lessonId}${query}`,
    {
      cache: {
        key: `lesson:${language ?? "default"}:${lessonId}`,
        ttlMs: 1000 * 60 * 15,
      },
    },
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
    {
      cache: {
        key: `lesson-slug:${language ?? "default"}:${slug}`,
        ttlMs: 1000 * 60 * 15,
      },
    },
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
      cache: { key: "hearts", ttlMs: 1000 * 20 },
    },
  );
  return response.data;
}

export async function restoreRewardedHeart(token: string): Promise<HeartState> {
  const response = await apiRequest<ApiEnvelope<HeartState>>(
    "/gamification/hearts/rewarded-restore",
    {
      method: "POST",
      token,
    },
  );
  await clearUserDataCache(token);
  return response.data;
}

export async function getStreak(token: string): Promise<StreakState> {
  const response = await apiRequest<ApiEnvelope<StreakState>>(
    "/gamification/streaks",
    { token, cache: { key: "streak", ttlMs: 1000 * 60 * 2 } },
  );
  return response.data;
}

export async function getDashboard(token: string): Promise<DashboardData> {
  const response = await apiRequest<ApiEnvelope<DashboardData>>(
    "/gamification/dashboard",
    { token, cache: { key: "dashboard", ttlMs: 1000 * 60 * 2 } },
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
  }).then(async (result) => {
    await clearUserDataCache(token);
    return result;
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
      cache: { key: "in-progress-lessons", ttlMs: 1000 * 60 * 2 },
    },
  );
  return response.progress;
}

export async function getAchievementsCatalog(): Promise<Achievement[]> {
  const response = await apiRequest<{ achievements: Achievement[] }>(
    "/achievements/catalog",
    {
      cache: { key: "achievements-catalog", ttlMs: 1000 * 60 * 60 },
    },
  );
  return response.achievements;
}

export async function getEarnedAchievements(
  token: string,
): Promise<EarnedAchievement[]> {
  const response = await apiRequest<{ achievements: EarnedAchievement[] }>(
    "/progress/achievements",
    { token, cache: { key: "earned-achievements", ttlMs: 1000 * 60 * 5 } },
  );
  return response.achievements;
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
  correctOption?: number | null;
  heartsRemaining: number;
  completedAt: string | null;
  passed: boolean | null;
  heartState?: HeartState;
}> {
  return apiRequest<{
    attempt?: { isCorrect: boolean };
    correctOption?: number | null;
    heartsRemaining: number;
    completedAt: string | null;
    passed: boolean | null;
    heartState?: HeartState;
  }>(`/quiz/sessions/${sessionId}/answer`, {
    method: "POST",
    token,
    body: { selectedOption },
  }).then(async (result) => {
    await clearUserDataCache(token);
    return result;
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
