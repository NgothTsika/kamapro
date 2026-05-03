import { prisma } from "../../lib/prisma";
import type { ChapterStep } from "@prisma/client";

let chapterStepMediaColumnsPromise: Promise<{
  backgroundMusic: boolean;
  soundEffects: boolean;
  narration: boolean;
}> | null = null;

export async function getChapterStepMediaColumns() {
  if (!chapterStepMediaColumnsPromise) {
    chapterStepMediaColumnsPromise = prisma
      .$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ChapterStep'
          AND column_name IN ('backgroundMusic', 'soundEffects', 'narration')
      `
      .then((rows) => {
        const names = new Set(rows.map((row) => row.column_name));
        return {
          backgroundMusic: names.has("backgroundMusic"),
          soundEffects: names.has("soundEffects"),
          narration: names.has("narration"),
        };
      })
      .catch(() => ({
        backgroundMusic: false,
        soundEffects: false,
        narration: false,
      }));
  }

  return chapterStepMediaColumnsPromise;
}

export async function getChapterStepSelect() {
  const mediaColumns = await getChapterStepMediaColumns();

  return {
    id: true,
    chapterId: true,
    order: true,
    type: true,
    content: true,
    mediaUrl: true,
    mediaType: true,
    ...(mediaColumns.backgroundMusic ? { backgroundMusic: true } : {}),
    ...(mediaColumns.soundEffects ? { soundEffects: true } : {}),
    ...(mediaColumns.narration ? { narration: true } : {}),
    createdAt: true,
    updatedAt: true,
  } as const;
}

const htmlToText = (value: string) =>
  value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

function collectText(value: unknown): string[] {
  if (typeof value === "string") return [htmlToText(value)];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (!value || typeof value !== "object") return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectText(item));
  }

  const record = value as Record<string, unknown>;
  const pieces: string[] = [];
  for (const [key, nestedValue] of Object.entries(record)) {
    if (
      key.toLowerCase().includes("url") ||
      key.toLowerCase().includes("timestamp") ||
      key === "order" ||
      key === "correctOption" ||
      key === "volume" ||
      key === "defaultSpeed" ||
      key === "defaultVolume"
    ) {
      continue;
    }
    pieces.push(...collectText(nestedValue));
  }
  return pieces;
}

export function getStepPlainText(content: unknown): string {
  return collectText(content).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function withComputedPlainText(content: Record<string, unknown>) {
  return {
    ...content,
    plainText: getStepPlainText(content),
  };
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function serializeChapterStep(step: Partial<ChapterStep> & Record<string, any>) {
  const content = withComputedPlainText((step.content ?? {}) as Record<string, unknown>);
  const backgroundMusic = getRecord((step as any).backgroundMusic);
  const narration = getRecord((step as any).narration);
  const soundEffects = Array.isArray((step as any).soundEffects)
    ? ((step as any).soundEffects as Array<Record<string, unknown>>)
    : [];

  return {
    ...step,
    content,
    plainText: content.plainText,
    backgroundMusic: backgroundMusic ?? null,
    soundEffects,
    narration: narration ?? null,
    backgroundMusicUrl:
      (backgroundMusic?.url as string | undefined) ??
      (step.mediaType === "audio" ? step.mediaUrl : null),
    backgroundMusicVolume: getNumber(backgroundMusic?.volume, 0.3),
    narrationUrl: (narration?.url as string | undefined) ?? null,
    narrationSpeed: getNumber(narration?.defaultSpeed, 1),
    narrationVolume: getNumber(narration?.defaultVolume, 1),
  };
}

export function serializeChapterWithSteps<T extends { steps?: ChapterStep[] }>(
  chapter: T,
) {
  return {
    ...chapter,
    steps: (chapter.steps ?? []).map(serializeChapterStep),
  };
}

/**
 * Create a new step in a chapter
 */
export async function createChapterStep(
  chapterId: string,
  data: {
    order: number;
    type: string;
    content: Record<string, unknown>;
    mediaUrl?: string;
    mediaType?: string;
    backgroundMusic?: Record<string, unknown> | null;
    soundEffects?: Array<Record<string, unknown>> | null;
    narration?: Record<string, unknown> | null;
  },
): Promise<ChapterStep> {
  // Validate chapter exists
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
  });

  if (!chapter) throw new Error("Chapter not found");

  const mediaColumns = await getChapterStepMediaColumns();
  return prisma.chapterStep.create({
    data: {
      chapterId,
      order: data.order,
      type: data.type as any,
      content: withComputedPlainText(data.content) as any,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      ...(mediaColumns.backgroundMusic
        ? { backgroundMusic: data.backgroundMusic as any }
        : {}),
      ...(mediaColumns.soundEffects ? { soundEffects: data.soundEffects as any } : {}),
      ...(mediaColumns.narration ? { narration: data.narration as any } : {}),
    },
    select: await getChapterStepSelect(),
  });
}

/**
 * Update a step
 */
export async function updateChapterStep(
  stepId: string,
  data: Partial<{
    order: number;
    type: string;
    content: Record<string, unknown>;
    mediaUrl: string;
    mediaType: string;
    backgroundMusic: Record<string, unknown> | null;
    soundEffects: Array<Record<string, unknown>> | null;
    narration: Record<string, unknown> | null;
  }>,
): Promise<ChapterStep> {
  const mediaColumns = await getChapterStepMediaColumns();
  const updateData: any = {};
  if (data.order !== undefined) updateData.order = data.order;
  if (data.type) updateData.type = data.type;
  if (data.content) updateData.content = withComputedPlainText(data.content);
  if (data.mediaUrl !== undefined) updateData.mediaUrl = data.mediaUrl;
  if (data.mediaType) updateData.mediaType = data.mediaType;
  if (mediaColumns.backgroundMusic && data.backgroundMusic !== undefined) {
    updateData.backgroundMusic = data.backgroundMusic;
  }
  if (mediaColumns.soundEffects && data.soundEffects !== undefined) {
    updateData.soundEffects = data.soundEffects;
  }
  if (mediaColumns.narration && data.narration !== undefined) {
    updateData.narration = data.narration;
  }

  return prisma.chapterStep.update({
    where: { id: stepId },
    data: updateData,
    select: await getChapterStepSelect(),
  });
}

/**
 * Delete a step
 */
export async function deleteChapterStep(stepId: string): Promise<void> {
  // Delete all responses to this step
  await prisma.chapterPollResponse.deleteMany({
    where: { stepId },
  });
  await prisma.chapterChoiceResponse.deleteMany({
    where: { stepId },
  });

  // Delete the step
  await prisma.chapterStep.delete({
    where: { id: stepId },
    select: { id: true },
  });
}

/**
 * Reorder steps in a chapter
 */
export async function reorderChapterSteps(
  chapterId: string,
  stepIds: string[],
): Promise<ChapterStep[]> {
  const updated = [];
  const chapterStepSelect = await getChapterStepSelect();

  for (let i = 0; i < stepIds.length; i++) {
    const step = await prisma.chapterStep.update({
      where: { id: stepIds[i] },
      data: { order: i },
      select: chapterStepSelect,
    });
    updated.push(step);
  }

  return updated;
}

/**
 * Get chapter with all steps
 */
export async function getChapterWithSteps(chapterId: string) {
  return prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      steps: { orderBy: { order: "asc" }, select: await getChapterStepSelect() },
    },
  });
}

/**
 * Respond to a poll/choice step
 */
export async function recordStepResponse(
  userId: string,
  stepId: string,
  type: "poll" | "choice",
  selectedOption: number,
  chosenStepId?: string,
) {
  if (type === "poll") {
    return prisma.chapterPollResponse.upsert({
      where: {
        userId_stepId: { userId, stepId },
      },
      update: { selectedOption },
      create: {
        userId,
        stepId,
        selectedOption,
      },
    });
  }

  if (type === "choice") {
    return prisma.chapterChoiceResponse.upsert({
      where: {
        userId_stepId: { userId, stepId },
      },
      update: { selectedOption, chosenStepId },
      create: {
        userId,
        stepId,
        selectedOption,
        chosenStepId,
      },
    });
  }

  throw new Error("Invalid response type");
}

/**
 * Get user's response to a step
 */
export async function getUserStepResponse(userId: string, stepId: string) {
  const pollResponse = await prisma.chapterPollResponse.findUnique({
    where: {
      userId_stepId: { userId, stepId },
    },
  });

  if (pollResponse) return pollResponse;

  return prisma.chapterChoiceResponse.findUnique({
    where: {
      userId_stepId: { userId, stepId },
    },
  });
}
