export type AdminReportStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";

export type AdminSubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type UserRole = "USER" | "MODERATOR" | "ADMIN";

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  xp: number;
  streak: number;
  createdAt: string;
};

export type MeUser = {
  id: string;
  email: string | null;
  username: string;
  avatar: string | null;
  role: UserRole;
  language: string;
  xp: number;
  streak: number;
  offlineEnabled: boolean;
  createdAt: string;
};

export type ModerationReport = {
  id: string;
  status: AdminReportStatus;
  reason: string;
  description: string | null;
  createdAt: string;
  reporter: {
    id: string;
    username: string;
    email: string | null;
  };
  lesson: {
    id: string;
    title: string;
  } | null;
  submission: {
    id: string;
    title: string;
    status: AdminSubmissionStatus;
  } | null;
};

export type ModerationSubmission = {
  id: string;
  status: AdminSubmissionStatus;
  title: string;
  description: string;
  content: string | null;
  imageUrl: string | null;
  sources: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string | null;
  };
  category: {
    id: string;
    name: string;
  };
  reports: Array<{
    id: string;
    status: AdminReportStatus;
  }>;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  xpRequired: number | null;
  streakRequired: number | null;
  createdAt: string;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  icon: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminTopic = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminLessonSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  published: boolean;
  order: number;
  xpReward: number;
  isPremium: boolean;
  coverImage: string | null;
  category: { id: string; name: string; slug: string } | null;
  topic: { id: string; name: string; slug: string } | null;
  _count: { chapters: number; quizzes: number };
};

export type Chapter = {
  id: string;
  lessonId: string;
  title: string;
  coverImage: string | null;
  content: string;
  introText: string | null;
  introAudioUrl: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  feedbackQuestion: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type QuizTranslationAdmin = {
  id: string;
  quizId: string;
  language: string;
  question: string;
  options: string[];
  explanation: string | null;
  pollDescription?: string | null; // NEW: Translation for poll context
  createdAt: string;
};

export type QuizAdmin = {
  id: string;
  lessonId: string;
  chapterId?: string | null;
  question: string;
  options: string[];
  correctOption: number | null; // UPDATED: Now nullable for polls
  explanation: string | null;
  order: number;
  heartLimit: number;
  timeLimitSeconds: number | null;
  difficulty: string | null;
  isActive: boolean;
  tags: string[];
  topicId: string | null;
  type?: "true_false" | "multiple_choice" | "image_choice" | "poll"; // UPDATED: Added poll type
  optionImages?: string[] | null;
  questionAudioUrl?: string | null; // NEW: Audio narration for question
  isPoll?: boolean; // NEW: Mark as poll question
  pollDescription?: string | null; // NEW: Context for poll question
  pollResults?: Record<string, number> | null; // NEW: Vote counts per option
  totalPollVotes?: number; // NEW: Total votes cast
  createdAt: string;
  updatedAt: string;
  translations?: QuizTranslationAdmin[];
};

export type CharacterTranslationAdmin = {
  id: string;
  characterId: string;
  language: string;
  name: string;
  description: string;
  story: string | null;
  createdAt: string;
};

export type LessonTranslationAdmin = {
  id: string;
  lessonId: string;
  language: string;
  title: string;
  description: string | null;
  hook: string | null;
  deepDiveContent: string | null;
  createdAt: string;
};

export type AdminLessonDetail = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string | null;
  hook: string | null;
  coverImage: string | null;
  xpReward: number;
  isPremium: boolean;
  published: boolean;
  order: number;
  categoryId: string | null;
  topicId: string | null;
  deepDiveContent: string | null;
  titleAudioUrl?: string | null;
  hookAudioUrl?: string | null;
  contentAudioUrl?: string | null;
  deepDiveAudioUrl?: string | null;
  category: { id: string; name: string; slug: string } | null;
  topic: { id: string; name: string; slug: string } | null;
  chapters: Chapter[];
  quizzes: QuizAdmin[];
  translations: LessonTranslationAdmin[];
  relatedCharacters: { character: AdminCharacter }[];
  createdAt: string;
  updatedAt: string;
};

export type EntityType = "person" | "place" | "event" | "tradition" | "concept";

export type PersonType =
  | "inventor"
  | "doctor"
  | "singer"
  | "artist"
  | "scientist"
  | "philosopher"
  | "athlete"
  | "activist"
  | "leader"
  | string; // Allow custom types

export type PlaceType =
  | "city"
  | "country"
  | "region"
  | "monument"
  | "institution"
  | string; // Allow custom types

export type EventType =
  | "war"
  | "revolution"
  | "discovery"
  | "cultural_event"
  | "natural_disaster"
  | string; // Allow custom types

export type TraditionType =
  | "holiday"
  | "ritual"
  | "art_form"
  | "belief_system"
  | "festival"
  | string; // Allow custom types

export type ConceptType =
  | "movement"
  | "philosophy"
  | "technology"
  | "culture"
  | string; // Allow custom types

// NEW: CharacterLesson - represents lesson assigned to character
export type CharacterLessonAdmin = {
  id: string;
  lessonId: string;
  characterId: string;
  order: number;
  lesson: AdminLessonSummary;
  createdAt: string;
  updatedAt: string;
};

export type AdminCharacter = {
  id: string;
  name: string;
  slug: string;
  description: string;
  story: string | null;
  imageUrl: string | null;
  inventionImage: string | null;
  xpThreshold: number | null;
  rarityLevel: string | null;
  categories: Array<{ category: { id: string; name: string; slug: string } }>;
  lessons?: CharacterLessonAdmin[]; // NEW: Lessons assigned to this character
  createdAt: string;
  updatedAt: string;
  translations?: CharacterTranslationAdmin[];

  // ...existing code...
  entityType?: EntityType | null;
  personType?: PersonType | null;
  placeType?: PlaceType | null;
  eventType?: EventType | null;
  traditionType?: TraditionType | null;
  conceptType?: ConceptType | null;

  // Flexible metadata
  metadata?: Record<string, any> | null;

  // Common fields
  birthYear?: number | null;
  endYear?: number | null;
  country?: string | null;
  achievements?: any[] | null;
};

export type AdminCharacterDetail = AdminCharacter & {
  translations: CharacterTranslationAdmin[];
};

// ========== User-Facing Types (Public API) ==========

export type Quiz = {
  id: string;
  chapterId?: string | null;
  question: string;
  options: string[];
  explanation: string | null;
  heartLimit: number;
  timeLimitSeconds: number | null;
  difficulty: string | null;
  tags: string[];
  topicId: string | null;
  questionAudioUrl?: string | null; // NEW: Audio narration for question
  isPoll?: boolean; // NEW: Mark as poll question
  pollDescription?: string | null; // NEW: Context for poll question
  pollResults?: Record<string, number> | null; // NEW: Vote percentages per option
  totalPollVotes?: number; // NEW: Total votes cast
};

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string | null;
  hook: string | null;
  coverImage: string | null;
  xpReward: number;
  isPremium: boolean;
  category: { id: string; name: string; slug: string } | null;
  topic: { id: string; name: string; slug: string } | null;
  chapters: Chapter[];
  quizzes: Quiz[];
  titleAudioUrl?: string | null;
  hookAudioUrl?: string | null;
  contentAudioUrl?: string | null;
  deepDiveAudioUrl?: string | null;
};

export type Character = {
  id: string;
  name: string;
  slug: string;
  description: string;
  story: string | null;
  imageUrl: string | null;
  rarityLevel: string | null;
  xpThreshold: number | null;
  categories: Array<{ category: { id: string; name: string; slug: string } }>;
  unlockLesson: { id: string; slug: string } | null;
  lessons?: Array<{ id: string; slug: string; title: string }>; // NEW: Lessons for this character
  entityType?: string | null;
  personType?: string | null;
  placeType?: string | null;
  eventType?: string | null;
  traditionType?: string | null;
  conceptType?: string | null;
  metadata?: Record<string, any> | null;
  birthYear?: number | null;
  endYear?: number | null;
  country?: string | null;
  achievements?: any[] | null;
};

// ========== Admin Types ==========

// ========== Gamification Types ==========

export type UserHeartsResponse = {
  hearts: number;
  maxHearts: number;
  lastHeartLossAt: string | null;
  nextRecoveryAt: string | null;
  timeUntilNextHeartMs: number;
  isPremium: boolean;
  recovered: number;
};

export type UserStreakResponse = {
  current: number;
  longest: number;
  lastActivityAt: string | null;
  isFrozen: boolean;
  freezeExpiresAt: string | null;
  freezesAvailable: number;
};

export type HeartRecoveryStatus = {
  nextRecoveryAt: string | null;
  timeUntilNextHeartMs: number;
};

export type GameOverResponse = {
  hearts: number;
  status: "game_over" | "heart_lost";
  message: string;
};

export type StreakCheckInResponse = {
  streak: number;
  message: string;
  isFrozen: boolean;
};

export type FreezeStreakResponse = {
  isFrozen: boolean;
  freezeExpiresAt: string;
  freezesRemaining: number;
  message: string;
};

export type UnlockedCharacter = {
  id: string;
  name: string;
  image: string | null;
  unlockedAt: string;
  favoriteLevel: number;
};

export type UnlockedCharactersResponse = {
  total: number;
  characters: UnlockedCharacter[];
};

export type CharacterUnlockCondition = {
  unlockId: string;
  type: "lesson_completion" | "xp_threshold" | "achievement" | "purchase";
  description: string;
  isMet: boolean;
  progress: number; // 0-100
  requirement: number | null;
  current: number;
};

export type CharacterUnlockProgress = {
  characterId: string;
  isFullyUnlocked: boolean;
  conditions: CharacterUnlockCondition[];
};

export type UnlockCharacterResponse = {
  id: string;
  unlockedAt: string;
  message: string;
};

export type PurchaseCharacterResponse = {
  id: string;
  unlockedAt: string;
  message: string;
};

export type FavoriteCharacterResponse = {
  id: string;
  favoriteLevel: number;
  message: string;
};

export type Challenge = {
  id: string;
  type: "lessons" | "quizzes" | "xp" | "streak" | "practice" | "review";
  title: string;
  description: string;
  targetCount: number;
  progress: number;
  isCompleted: boolean;
  isRewarded: boolean;
  percentComplete: number;
  xpReward: number;
};

export type ChallengesResponse = {
  total: number;
  challenges: Challenge[];
};

export type ClaimChallengeResponse = {
  challengeId: string;
  xpAwarded: number;
  claimedAt: string;
  message: string;
};

export type ChallengeStatsResponse = {
  totalChallenges: number;
  completedChallenges: number;
  claimedRewards: number;
  totalXpAvailable: number;
  totalXpClaimed: number;
  completionPercentage: number;
};

export type GamificationSummary = {
  hearts: {
    current: number;
    max: number;
    isPremium: boolean;
    nextRecoveryAt: string | null;
    timeUntilNextHeartMs: number;
  };
  streak: {
    current: number;
    longest: number;
    isFrozen: boolean;
    freezesAvailable: number;
  };
  characters: {
    unlocked: number;
  };
  challenges: {
    totalChallenges: number;
    completedToday: number;
    xpClaimedToday: number;
  };
};

// ==================== ADMIN TYPES ====================

// ---------- LEADERBOARD ADMIN TYPES ----------
export type LeaderboardEntry = {
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
};

export type UserLeaderboardStats = {
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
};

export type LeaderboardStatistics = {
  totalUsers: number;
  averageXp: number;
  topUserXp: number;
  averageStreak: number;
  xpDistribution: Record<string, number>;
  activityTrends: Array<{ date: string; activeUsers: number }>;
};

// ---------- CHARACTER COLLECTIONS ADMIN TYPES ----------
export type AdminCharacterCollectionSummary = {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  characterCount: number;
};

export type AdminCharacterCollectionDetail = AdminCharacterCollectionSummary & {
  characters: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    rarityLevel?: string;
  }>;
};

// ---------- COLLECTIONS ADMIN TYPES ----------
export type AdminCollectionSummary = {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  title: string;
  description?: string;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminCollectionDetail = AdminCollectionSummary & {
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
};

export type CollectionAnalytics = {
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
};

// ---------- COMMUNITY ADMIN TYPES ----------
export type AdminComment = {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  lessonId: string;
  lesson: {
    id: string;
    title: string;
  };
  content: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
  flagged?: boolean;
  flagReason?: string;
};

export type CommentStatistics = {
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
};

export type LessonDiscussionOverview = {
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
};

// ---------- SOCIAL ADMIN TYPES ----------
export type FollowingGraph = {
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  followerCount: number;
  followingCount: number;
  followers: Array<{ id: string; username: string; avatar?: string }>;
  following: Array<{ id: string; username: string; avatar?: string }>;
};

export type BookmarkedLesson = {
  lessonId: string;
  lesson: {
    id: string;
    title: string;
    slug: string;
  };
  bookmarkCount: number;
  lastBookmarkedAt: string;
};

export type ConnectionStatistics = {
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
};

export type AdminBookmark = {
  id: string;
  userId: string;
  user: { id: string; username: string };
  lessonId: string;
  lesson: { id: string; title: string };
  createdAt: string;
};

export type SuspiciousFollowPattern = {
  userId: string;
  username: string;
  pattern: string;
  followingCount: number;
  followerCount: number;
  ratio: number;
  riskScore: number;
};

// ---------- NOTIFICATIONS ADMIN TYPES ----------
export type NotificationLog = {
  id: string;
  userId: string;
  user: { id: string; username: string };
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type NotificationStatistics = {
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
};

export type ScheduledNotificationItem = {
  id: string;
  title: string;
  message: string;
  recipientCount: number;
  scheduledAt: string;
  status: "pending" | "sent";
};

export type PushTokenStatistics = {
  totalTokens: number;
  byPlatform: { ios: number; android: number };
  activeTokens: number;
  inactiveTokens: number;
};

// ---------- PROGRESS ADMIN TYPES ----------
export type UserProgressDetail = {
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
};

export type CourseCompletionStatistics = {
  totalUsers: number;
  usersWithProgress: number;
  averageProgressPercentage: number;
  completionByLesson: Array<{
    lessonId: string;
    title: string;
    completions: number;
    completionRate: number;
    averageTimeSpent: number;
  }>;
  difficultyAnalysis: Record<
    string,
    {
      lessonCount: number;
      averageCompletionRate: number;
      averageTimeSpent: number;
    }
  >;
};

export type DailyActiveUserData = {
  date: string;
  activeUsers: number;
  lessonsCompleted: number;
  averageSessionDuration: number;
};

export type ReadingGoalCompliance = {
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
};

export type LearningPathAnalytics = {
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
};

export type LearningTimeHeatmap = {
  hourlyActivity: Record<number, number>;
  dailyActivity: Record<string, number>;
  peakHours: number[];
  peakDays: string[];
};

export type RetentionStatistics = {
  dayOneRetention: number;
  weekOneRetention: number;
  monthOneRetention: number;
  cohortRetention: Array<{
    cohortDate: string;
    retentionRates: Record<string, number>;
  }>;
};

export type LessonDifficultyAnalysis = {
  byDifficulty: Record<
    string,
    {
      lessonCount: number;
      averageCompletionRate: number;
      averageTimeSpent: number;
      abandonmentRate: number;
    }
  >;
};

// ==================== INTERACTIVE CHAPTERS TYPES ====================

export type StepType =
  | "TEXT"
  | "TEXT_AUDIO"
  | "IMAGE_FULL"
  | "POLL"
  | "CHOICE"
  | "QUIZ_QUESTION"
  | "RECAP"
  | "CONTINUE_BUTTON";

export type StepContent = Record<string, any>;

export type ChapterStep = {
  id: string;
  chapterId: string;
  order: number;
  type: StepType;
  content: StepContent;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | "none" | null;
  createdAt: string;
  updatedAt: string;
};

export type InteractiveChapter = {
  id: string;
  lessonId: string;
  title: string;
  order: number;
  introText?: string | null;
  introAudioUrl?: string | null;
  steps: ChapterStep[];
  createdAt: string;
  updatedAt: string;
};

export type ChapterProgress = {
  id: string;
  userId: string;
  chapterId: string;
  currentStepIndex: number;
  completed: boolean;
  completedAt?: string | null;
};

export type ChapterCompletion = {
  id: string;
  userId: string;
  chapterId: string;
  completedAt: string;
};

export type LessonProgress = {
  id: string;
  userId: string;
  lessonId: string;
  currentChapterIndex: number;
  updatedAt: string;
};

export type ChapterDetail = InteractiveChapter & {
  progress?: ChapterProgress | null;
};

export type LessonInteractiveInfo = {
  lesson: Lesson & {
    chapters: InteractiveChapter[];
  };
  progress?: LessonProgress | null;
};

export type StepResponse = {
  id: string;
  userId: string;
  stepId: string;
  selectedOption: number;
  chosenStepId?: string | null;
  createdAt: string;
};
