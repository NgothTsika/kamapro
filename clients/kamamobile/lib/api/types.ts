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
  nextRecoveryAt?: string | null;
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
  id: string;
  title: string;
  order: number;
  content?: string;
};

/** Raw quiz row from GET /content/lessons/slug/:slug — options/optionImages are Json */
export type LessonQuizQuestion = {
  id: string;
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
