import { prisma } from "../../lib/prisma";
import type { ChapterStep } from "@prisma/client";

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
      content: data.content as any,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
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
  }>,
): Promise<ChapterStep> {
  const updateData: any = {};
  if (data.order !== undefined) updateData.order = data.order;
  if (data.type) updateData.type = data.type;
  if (data.content) updateData.content = data.content;
  if (data.mediaUrl !== undefined) updateData.mediaUrl = data.mediaUrl;
  if (data.mediaType) updateData.mediaType = data.mediaType;

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

