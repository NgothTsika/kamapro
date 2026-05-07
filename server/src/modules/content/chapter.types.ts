import { z } from "zod";

// ==================== ENUMS ====================

export const ChapterStepTypeEnum = z.enum([
  "TEXT",
  "TEXT_AUDIO",
  "IMAGE_FULL",
  "POLL",
  "CHOICE",
  "QUIZ_QUESTION",
  "RECAP",
  "CONTINUE_BUTTON",
]);

export type ChapterStepType = z.infer<typeof ChapterStepTypeEnum>;

// ==================== REQUEST SCHEMAS ====================

// Create chapter
export const CreateChapterSchema = z.object({
  title: z.string().min(1, "Title required"),
  order: z.number().int().nonnegative(),
  introText: z.string().optional().nullable(),
  introAudioUrl: z.string().url().optional().nullable(),
});

export type CreateChapterRequest = z.infer<typeof CreateChapterSchema>;

// Update chapter
export const UpdateChapterSchema = z.object({
  title: z.string().min(1).optional(),
  order: z.number().int().nonnegative().optional(),
  introText: z.string().optional().nullable(),
  introAudioUrl: z.string().url().optional().nullable(),
});

export type UpdateChapterRequest = z.infer<typeof UpdateChapterSchema>;

// Create step
export const CreateChapterStepSchema = z.object({
  order: z.number().int().nonnegative(),
  type: ChapterStepTypeEnum,
  content: z.record(z.any()),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["image", "video", "audio", "none"]).optional(),
  backgroundMusic: z
    .object({
      url: z.string().url(),
      volume: z.number().min(0).max(1).optional().default(0.3),
    })
    .optional()
    .nullable(),
  soundEffects: z
    .array(
      z.object({
        url: z.string().url(),
        trigger: z.enum(["onAppear", "onTap", "onComplete"]),
        volume: z.number().min(0).max(1).optional().default(1),
      }),
    )
    .optional()
    .nullable(),
  narration: z
    .object({
      url: z.string().url(),
      defaultSpeed: z.number().min(0.5).max(2).optional().default(1),
      defaultVolume: z.number().min(0).max(1).optional().default(1),
    })
    .optional()
    .nullable(),
});

export type CreateChapterStepRequest = z.infer<typeof CreateChapterStepSchema>;

// Update step
export const UpdateChapterStepSchema = z.object({
  order: z.number().int().nonnegative().optional(),
  type: ChapterStepTypeEnum.optional(),
  content: z.record(z.any()).optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["image", "video", "audio", "none"]).optional(),
  backgroundMusic: CreateChapterStepSchema.shape.backgroundMusic,
  soundEffects: CreateChapterStepSchema.shape.soundEffects,
  narration: CreateChapterStepSchema.shape.narration,
});

export type UpdateChapterStepRequest = z.infer<typeof UpdateChapterStepSchema>;

// Respond to step
export const RespondToStepSchema = z.object({
  type: z.enum(["poll", "choice", "quiz"]),
  selectedOption: z.number().int().nonnegative(),
  chosenStepId: z.string().optional(),
});

export type RespondToStepRequest = z.infer<typeof RespondToStepSchema>;

// Advance chapter
export const AdvanceChapterSchema = z.object({
  fromStepIndex: z.number().int().nonnegative(),
});

export type AdvanceChapterRequest = z.infer<typeof AdvanceChapterSchema>;

export const SetChapterStepIndexSchema = z.object({
  stepIndex: z.number().int().nonnegative(),
});

// Reorder steps
export const ReorderStepsSchema = z.object({
  stepIds: z.array(z.string()),
});

export type ReorderStepsRequest = z.infer<typeof ReorderStepsSchema>;

// ==================== RESPONSE TYPES ====================

export interface ChapterResponse {
  id: string;
  lessonId: string;
  title: string;
  coverImage?: string;
  order: number;
  introText?: string;
  introAudioUrl?: string;
  steps: ChapterStepResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ChapterStepResponse {
  id: string;
  chapterId: string;
  order: number;
  type: ChapterStepType;
  content: Record<string, any>;
  mediaUrl?: string;
  mediaType?: string;
  plainText: string;
  backgroundMusic?: Record<string, any> | null;
  soundEffects?: Array<Record<string, any>> | null;
  narration?: Record<string, any> | null;
  backgroundMusicUrl?: string | null;
  backgroundMusicVolume: number;
  narrationUrl?: string | null;
  narrationSpeed: number;
  narrationVolume: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserChapterProgressResponse {
  id: string;
  userId: string;
  chapterId: string;
  currentStepIndex: number;
  completed: boolean;
  completedAt?: string;
}

export interface UserLessonProgressResponse {
  id: string;
  userId: string;
  lessonId: string;
  currentChapterIndex: number;
  updatedAt: string;
}

export interface ChapterCompletionResponse {
  id: string;
  userId: string;
  chapterId: string;
  completedAt: string;
}

export interface StepResponseRecord {
  id: string;
  userId: string;
  stepId: string;
  selectedOption: number;
  chosenStepId?: string;
  createdAt: string;
}

// ==================== CONTENT TYPE VALIDATORS ====================

export function validateStepContent(
  type: ChapterStepType,
  content: any,
): boolean {
  const hasParagraphSlides = (c: any) =>
    Array.isArray(c.paragraphSlides) &&
    c.paragraphSlides.some(
      (slide: any) => typeof slide === "string" && slide.trim().length > 0,
    );
  const validators: Record<ChapterStepType, (c: any) => boolean> = {
    TEXT: (c) =>
      (typeof c.body === "string" && c.body.trim().length > 0) ||
      (Array.isArray(c.body) && c.body.length > 0) ||
      hasParagraphSlides(c),
    TEXT_AUDIO: (c) =>
      (typeof c.body === "string" && c.body.trim().length > 0) ||
      (Array.isArray(c.body) && c.body.length > 0) ||
      hasParagraphSlides(c),
    IMAGE_FULL: (c) =>
      c.imageUrl &&
      typeof c.imageUrl === "string" &&
      (c.caption === undefined ||
        typeof c.caption === "string" ||
        c.caption === null),
    POLL: (c) =>
      c.question &&
      typeof c.question === "string" &&
      Array.isArray(c.options) &&
      c.options.length > 0,
    CHOICE: (c) =>
      c.prompt &&
      typeof c.prompt === "string" &&
      Array.isArray(c.options) &&
      c.options.length > 0,
    QUIZ_QUESTION: (c) =>
      c.question &&
      Array.isArray(c.options) &&
      typeof c.correctOption === "number" &&
      c.correctOption >= 0 &&
      c.correctOption < c.options.length,
    RECAP: (c) =>
      (Array.isArray(c.points) &&
        c.points.every((p: any) => typeof p === "string")) ||
      (Array.isArray(c.items) &&
        c.items.every(
          (item: any) =>
            typeof item === "object" &&
            item !== null &&
            (typeof item.text === "string" || typeof item.plainText === "string"),
        )),
    CONTINUE_BUTTON: (c) => true,
  };

  const validator = validators[type];
  if (!validator) return false;

  try {
    return validator(content);
  } catch {
    return false;
  }
}

// ==================== ERROR TYPES ====================

export class ChapterError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ChapterError";
  }
}

export const ChapterErrors = {
  ChapterNotFound: () =>
    new ChapterError("CHAPTER_NOT_FOUND", "Chapter not found"),
  StepNotFound: () => new ChapterError("STEP_NOT_FOUND", "Step not found"),
  LessonNotFound: () =>
    new ChapterError("LESSON_NOT_FOUND", "Lesson not found"),
  InvalidStepContent: (type: string) =>
    new ChapterError(
      "INVALID_STEP_CONTENT",
      `Invalid content structure for step type: ${type}`,
    ),
  InvalidStepIndex: () =>
    new ChapterError("INVALID_STEP_INDEX", "Invalid step index"),
  AlreadyResponded: () =>
    new ChapterError(
      "ALREADY_RESPONDED",
      "User already responded to this step",
    ),
  NoProgress: (type: string) =>
    new ChapterError("NO_PROGRESS", `No progress record found for ${type}`),
};
