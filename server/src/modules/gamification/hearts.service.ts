import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/errors";
import { calculateHeartRecovery } from "./gamification.utils";

/**
 * Heart Recovery Service
 * Manages user hearts, recovery timing, and heart loss logic
 * Inspired by Duolingo's heart system
 */

export interface UserHeartsState {
  hearts: number;
  maxHearts: number;
  lastHeartLossAt: Date | null;
  lastRecoveredAt: Date | null;
  recoveryTimeMs: number;
  nextRecoveryAt: Date | null;
  willRecover: boolean;
  timeUntilNextHeartMs: number;
  isPremium: boolean;
}

type HeartConfigRecord = {
  heartsMaxHearts: number;
  heartsRecoveryTimeMs: number;
  heartsPremiumRecoveryTimeMs: number;
};

async function getOrCreateHeartConfig(): Promise<HeartConfigRecord> {
  let config = await prisma.gameConfig.findUnique({
    where: { id: "gamification" },
    select: {
      heartsMaxHearts: true,
      heartsRecoveryTimeMs: true,
      heartsPremiumRecoveryTimeMs: true,
    },
  });

  if (!config) {
    config = await prisma.gameConfig.create({
      data: {
        id: "gamification",
        heartsMaxHearts: 5,
        heartsRecoveryTimeMs: 3600000,
        heartsPremiumRecoveryTimeMs: 1800000,
        streaksCheckInHours: 24,
        streaksXpMultiplierFormula: "1 + (currentStreak / 100)",
        streaksMilestones: [7, 14, 30, 60, 100, 365],
        charactersUnlockXpThreshold: 100,
        charactersPurchaseXpCost: 50,
        gamificationEnabled: true,
        gamificationEventMultiplier: 1.0,
      },
      select: {
        heartsMaxHearts: true,
        heartsRecoveryTimeMs: true,
        heartsPremiumRecoveryTimeMs: true,
      },
    });
  }

  return config;
}

function isPremiumActive(premiumUntil: Date | null | undefined) {
  return Boolean(premiumUntil && premiumUntil.getTime() > Date.now());
}

function getEffectiveRecoveryTimeMs(
  config: HeartConfigRecord,
  premiumUntil: Date | null | undefined,
) {
  return isPremiumActive(premiumUntil)
    ? config.heartsPremiumRecoveryTimeMs
    : config.heartsRecoveryTimeMs;
}

async function getOrCreateUserHearts(userId: string) {
  const config = await getOrCreateHeartConfig();

  let record = await prisma.userHearts.findUnique({
    where: { userId },
  });

  if (!record) {
    record = await prisma.userHearts.create({
      data: {
        userId,
        hearts: config.heartsMaxHearts,
        maxHearts: config.heartsMaxHearts,
        recoveryTimeMs: config.heartsRecoveryTimeMs,
      },
    });
  }

  return { config, record };
}

async function syncRecoveredHeartsRecord(userId: string) {
  const { config, record } = await getOrCreateUserHearts(userId);
  const effectiveRecoveryTimeMs = getEffectiveRecoveryTimeMs(
    config,
    record.premiumUntil,
  );

  const configNeedsSync =
    record.maxHearts !== config.heartsMaxHearts ||
    record.recoveryTimeMs !== effectiveRecoveryTimeMs ||
    record.hearts > config.heartsMaxHearts;

  let current = record;

  if (configNeedsSync) {
    current = await prisma.userHearts.update({
      where: { userId },
      data: {
        maxHearts: config.heartsMaxHearts,
        recoveryTimeMs: effectiveRecoveryTimeMs,
        hearts: Math.min(record.hearts, config.heartsMaxHearts),
        lastHeartLossAt:
          Math.min(record.hearts, config.heartsMaxHearts) >=
          config.heartsMaxHearts
            ? null
            : record.lastHeartLossAt,
      },
    });
  }

  if (
    current.hearts >= current.maxHearts ||
    !current.lastHeartLossAt ||
    current.recoveryTimeMs <= 0
  ) {
    return current;
  }

  const elapsedMs = Date.now() - current.lastHeartLossAt.getTime();
  const recoveredSteps = Math.floor(elapsedMs / current.recoveryTimeMs);

  if (recoveredSteps <= 0) {
    return current;
  }

  const heartsToRecover = Math.min(
    recoveredSteps,
    current.maxHearts - current.hearts,
  );

  if (heartsToRecover <= 0) {
    return current;
  }

  const recoveredHearts = current.hearts + heartsToRecover;
  const nextLossAnchor =
    recoveredHearts >= current.maxHearts
      ? null
      : new Date(
          current.lastHeartLossAt.getTime() +
            heartsToRecover * current.recoveryTimeMs,
        );

  const updated = await prisma.userHearts.update({
    where: { userId },
    data: {
      hearts: recoveredHearts,
      lastRecoveredAt: new Date(),
      lastHeartLossAt: nextLossAnchor,
    },
  });

  await prisma.heartRecoveryEvent.create({
    data: {
      userId,
      heartsRecovered: heartsToRecover,
      fromHearts: current.hearts,
      toHearts: updated.hearts,
      recoveryType: "automatic",
    },
  });

  return updated;
}

function buildHeartState(userHearts: {
  hearts: number;
  maxHearts: number;
  lastHeartLossAt: Date | null;
  lastRecoveredAt: Date | null;
  recoveryTimeMs: number;
  premiumUntil?: Date | null;
}): UserHeartsState {
  const heartRecoveryTime = calculateHeartRecovery(
    userHearts.lastHeartLossAt,
    userHearts.recoveryTimeMs,
  );
  const nextRecoveryAt =
    userHearts.hearts >= userHearts.maxHearts
      ? null
      : heartRecoveryTime.nextRecoveryAt;

  return {
    hearts: userHearts.hearts,
    maxHearts: userHearts.maxHearts,
    lastHeartLossAt: userHearts.lastHeartLossAt,
    lastRecoveredAt: userHearts.lastRecoveredAt,
    recoveryTimeMs: userHearts.recoveryTimeMs,
    nextRecoveryAt,
    willRecover: heartRecoveryTime.willRecover,
    timeUntilNextHeartMs: nextRecoveryAt
      ? Math.max(0, nextRecoveryAt.getTime() - Date.now())
      : 0,
    isPremium: isPremiumActive(userHearts.premiumUntil),
  };
}

/**
 * Get current heart state for a user
 */
export async function getUserHearts(userId: string): Promise<UserHeartsState> {
  const userHearts = await syncRecoveredHeartsRecord(userId);
  return buildHeartState(userHearts);
}

/**
 * Initialize hearts for a new user
 * Uses the configured max hearts from gamification settings
 */
export async function initializeUserHearts(userId: string) {
  const config = await getOrCreateHeartConfig();
  const configuredMaxHearts = config.heartsMaxHearts;

  return await prisma.userHearts.create({
    data: {
      userId,
      hearts: configuredMaxHearts,
      maxHearts: configuredMaxHearts,
      recoveryTimeMs: config.heartsRecoveryTimeMs,
    },
  });
}

/**
 * Deduct a heart from the user (lesson failure or quiz failure)
 */
export async function loseHeart(
  userId: string,
  reason: string = "lesson_failure",
): Promise<UserHeartsState> {
  const userHearts = await syncRecoveredHeartsRecord(userId);

  if (userHearts.hearts <= 0) {
    throw new HttpError(400, "User has no hearts left");
  }

  // Deduct heart and record loss
  const updated = await prisma.userHearts.update({
    where: { userId },
    data: {
      hearts: userHearts.hearts - 1,
      lastHeartLossAt: new Date(),
      totalHeartLosses: userHearts.totalHeartLosses + 1,
    },
  });

  // Log the event for analytics
  await prisma.heartRecoveryEvent.create({
    data: {
      userId,
      heartsRecovered: 0,
      fromHearts: userHearts.hearts,
      toHearts: updated.hearts,
      recoveryType: "loss",
    },
  });

  return buildHeartState(updated);
}

/**
 * Recover one heart (if recovery time has passed)
 */
export async function recoverHeart(userId: string): Promise<UserHeartsState> {
  const userHearts = await syncRecoveredHeartsRecord(userId);

  if (userHearts.hearts >= userHearts.maxHearts) {
    throw new HttpError(400, "User already has maximum hearts");
  }

  if (!userHearts.lastHeartLossAt) {
    throw new HttpError(
      400,
      "Hearts are not ready to recover yet",
    );
  }

  const heartRecoveryTime = calculateHeartRecovery(
    userHearts.lastHeartLossAt,
    userHearts.recoveryTimeMs,
  );

  if (!heartRecoveryTime.willRecover) {
    throw new HttpError(
      400,
      `Hearts will recover in ${heartRecoveryTime.minutesUntilRecovery} minutes`,
    );
  }

  const updated = await prisma.userHearts.update({
    where: { userId },
    data: {
      hearts: userHearts.hearts + 1,
      lastRecoveredAt: new Date(),
      lastHeartLossAt:
        userHearts.hearts + 1 >= userHearts.maxHearts ? null : new Date(),
    },
  });

  // Log recovery event
  await prisma.heartRecoveryEvent.create({
    data: {
      userId,
      heartsRecovered: 1,
      fromHearts: userHearts.hearts,
      toHearts: updated.hearts,
      recoveryType: "automatic",
    },
  });

  return buildHeartState(updated);
}

/**
 * Recover all hearts (premium feature or achievement)
 */
export async function restoreFullHearts(
  userId: string,
  reason: string = "achievement",
): Promise<UserHeartsState> {
  const userHearts = await syncRecoveredHeartsRecord(userId);

  const heartsRecovered = userHearts.maxHearts - userHearts.hearts;

  const updated = await prisma.userHearts.update({
    where: { userId },
    data: {
      hearts: userHearts.maxHearts,
      lastRecoveredAt: new Date(),
      lastHeartLossAt: null,
    },
  });

  // Log recovery event
  if (heartsRecovered > 0) {
    await prisma.heartRecoveryEvent.create({
      data: {
        userId,
        heartsRecovered,
        fromHearts: userHearts.hearts,
        toHearts: updated.hearts,
        recoveryType: reason,
      },
    });
  }

  return buildHeartState(updated);
}

/**
 * Set custom recovery time (for premium features or tier upgrades)
 */
export async function setRecoveryTime(
  userId: string,
  recoveryTimeMs: number,
): Promise<void> {
  if (recoveryTimeMs < 60000) {
    // Minimum 1 minute
    throw new HttpError(
      400,
      "Recovery time must be at least 1 minute (60000ms)",
    );
  }

  if (recoveryTimeMs > 86400000) {
    // Maximum 24 hours
    throw new HttpError(
      400,
      "Recovery time cannot exceed 24 hours (86400000ms)",
    );
  }

  await prisma.userHearts.update({
    where: { userId },
    data: { recoveryTimeMs },
  });
}

/**
 * Get heart recovery history/analytics
 */
export async function getHeartRecoveryHistory(
  userId: string,
  limit: number = 50,
) {
  return await prisma.heartRecoveryEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
