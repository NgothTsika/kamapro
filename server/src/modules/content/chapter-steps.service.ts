import { prisma } from "../../lib/prisma";
import type { ChapterStep } from "@prisma/client";

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

export function serializeChapterStep(step: ChapterStep) {
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

  return prisma.chapterStep.create({
    data: {
      chapterId,
      order: data.order,
      type: data.type as any,
      content: withComputedPlainText(data.content) as any,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      backgroundMusic: data.backgroundMusic as any,
      soundEffects: data.soundEffects as any,
      narration: data.narration as any,
    },
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
  const updateData: any = {};
  if (data.order !== undefined) updateData.order = data.order;
  if (data.type) updateData.type = data.type;
  if (data.content) updateData.content = withComputedPlainText(data.content);
  if (data.mediaUrl !== undefined) updateData.mediaUrl = data.mediaUrl;
  if (data.mediaType) updateData.mediaType = data.mediaType;
  if (data.backgroundMusic !== undefined) updateData.backgroundMusic = data.backgroundMusic;
  if (data.soundEffects !== undefined) updateData.soundEffects = data.soundEffects;
  if (data.narration !== undefined) updateData.narration = data.narration;

  return prisma.chapterStep.update({
    where: { id: stepId },
    data: updateData,
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

  for (let i = 0; i < stepIds.length; i++) {
    const step = await prisma.chapterStep.update({
      where: { id: stepIds[i] },
      data: { order: i },
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
      steps: { orderBy: { order: "asc" } },
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
