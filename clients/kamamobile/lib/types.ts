export type StepType =
  | "TEXT"
  | "TEXT_AUDIO"
  | "IMAGE_FULL"
  | "POLL"
  | "CHOICE"
  | "QUIZ_QUESTION"
  | "RECAP"
  | "CONTINUE_BUTTON";

export type ChapterStep = {
  id: string;
  chapterId: string;
  order: number;
  type: StepType;
  content: Record<string, any>;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | "none" | null;
  createdAt: string;
  updatedAt: string;
};

export type Chapter = {
  id: string;
  lessonId: string;
  title: string;
  coverImage?: string | null;
  order: number;
  introText?: string | null;
  introAudioUrl?: string | null;
  steps: ChapterStep[];
  quizzes?: Array<{
    id: string;
    chapterId?: string | null;
    type?: string | null;
    question: string;
    options: string[];
    optionImages?: string[] | null;
    explanation: string | null;
    heartLimit: number;
    timeLimitSeconds: number | null;
    difficulty: string | null;
    tags: string[];
    topicId: string | null;
    questionAudioUrl?: string | null;
    isPoll?: boolean;
    pollDescription?: string | null;
    pollResults?: Record<string, number> | null;
    totalPollVotes?: number;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type UserChapterProgress = {
  id: string;
  userId: string;
  chapterId: string;
  currentStepIndex: number;
  completed: boolean;
  completedAt?: string | null;
};

export type UserLessonProgress = {
  id: string;
  userId: string;
  lessonId: string;
  currentChapterIndex: number;
  updatedAt: string;
};

export type LessonProgressChapter = Chapter & {
  chapterProgress?: UserChapterProgress[];
};

export type LessonProgressDetails = {
  lesson: {
    id: string;
    title: string;
    chapters: LessonProgressChapter[];
  };
  lessonProgress: UserLessonProgress;
  currentChapter?: LessonProgressChapter | null;
};

export type StepResponseRecord = {
  id: string;
  userId: string;
  stepId: string;
  selectedOption: number;
  chosenStepId?: string | null;
  createdAt: string;
};
