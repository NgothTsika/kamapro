import { prisma } from "../../../lib/prisma";
import { HttpError } from "../../../lib/errors";

export class GamificationAdminService {
  /**
   * Get all users with their heart status
   */
  async getAllUserHearts(
    limit: number = 50,
    offset: number = 0,
    sortBy: "hearts" | "lastLoss" | "recovery" = "hearts",
    order: "asc" | "desc" = "desc",
  ) {
    const validSortFields = {
      hearts: "hearts",
      lastLoss: "lastHeartLossAt",
      recovery: "nextRecoveryTime",
    };

    const orderBy = { [validSortFields[sortBy]]: order };

    const [hearts, total] = await Promise.all([
      prisma.userHearts.findMany({
        take: limit,
        skip: offset,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              email: true,
            },
          },
        },
      }),
      prisma.userHearts.count(),
    ]);

    return {
      data: hearts.map((h) => ({
        ...h,
        nextRecoveryAt: this.calculateNextRecoveryTime(h),
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get heart system statistics
   */
  async getHeartStats() {
    const hearts = await prisma.userHearts.findMany();
    const events = await prisma.heartRecoveryEvent.findMany();

    const totalUsers = hearts.length;
    const heartsWithMax = hearts.reduce((sum, h) => sum + h.hearts, 0);
    const avgHearts = totalUsers > 0 ? heartsWithMax / totalUsers : 0;

    const recoveryTimes = hearts
      .filter((h) => h.lastHeartLossAt && h.lastHeartLossAt < new Date())
      .map((h) => {
        const recovered = this.calculateNextRecoveryTime(h);
        return recovered.getTime() - new Date().getTime();
      })
      .filter((t) => t > 0);

    const avgRecoveryTime =
      recoveryTimes.length > 0
        ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
        : 0;

    return {
      totalUsers,
      avgHearts: Math.round(avgHearts * 100) / 100,
      totalHeartLosses: events.length,
      heartsRecovered: events.reduce((sum, e) => sum + e.heartsRecovered, 0),
      avgRecoveryTimeMs: Math.round(avgRecoveryTime),
      usersWithFullHearts: hearts.filter((h) => h.hearts === h.maxHearts)
        .length,
      usersWithNoHearts: hearts.filter((h) => h.hearts === 0).length,
    };
  }

  /**
   * Get heart recovery event history
   */
  async getHeartRecoveryHistory(limit: number = 50, offset: number = 0) {
    const [events, total] = await Promise.all([
      prisma.heartRecoveryEvent.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.heartRecoveryEvent.count(),
    ]);

    return {
      data: events,
      total,
      limit,
      offset,
    };
  }

  /**
   * Manually restore hearts for a user
   */
  async restoreUserHearts(userId: string, heartsToRestore: number) {
    const userHearts = await prisma.userHearts.findUnique({
      where: { userId },
    });

    if (!userHearts) {
      throw new HttpError(404, "User hearts record not found");
    }

    const newHearts = Math.min(
      userHearts.hearts + heartsToRestore,
      userHearts.maxHearts,
    );

    const actualRestored = newHearts - userHearts.hearts;

    const updated = await prisma.userHearts.update({
      where: { userId },
      data: {
        hearts: newHearts,
        lastHeartLossAt: null,
      },
    });

    // Log this action
    await prisma.heartRecoveryEvent.create({
      data: {
        userId,
        heartsRecovered: actualRestored,
        fromHearts: userHearts.hearts,
        toHearts: newHearts,
        recoveryType: "ADMIN_RESTORE",
      },
    });

    return {
      ...updated,
      actualRestored,
      message: `Restored ${actualRestored} hearts for user ${userId}`,
    };
  }

  /**
   * Get all users with their streak status
   */
  async getAllUserStreaks(
    limit: number = 50,
    offset: number = 0,
    sortBy: "current" | "longest" | "freezes" = "current",
    order: "asc" | "desc" = "desc",
  ) {
    const validSortFields = {
      current: "currentStreak",
      longest: "longestStreak",
      freezes: "freezesRemaining",
    };

    const orderBy = { [validSortFields[sortBy]]: order };

    const [streaks, total] = await Promise.all([
      prisma.userStreak.findMany({
        take: limit,
        skip: offset,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              email: true,
            },
          },
        },
      }),
      prisma.userStreak.count(),
    ]);

    return {
      data: streaks,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get streak system statistics
   */
  async getStreakStats() {
    const streaks = await prisma.userStreak.findMany();
    const checkIns = await prisma.streakCheckIn.findMany();

    const totalUsers = streaks.length;
    const currentStreaks = streaks.map((s) => s.currentStreak);
    const longestStreaks = streaks.map((s) => s.longestStreak);

    const avgCurrentStreak =
      totalUsers > 0
        ? currentStreaks.reduce((a, b) => a + b, 0) / totalUsers
        : 0;
    const avgLongestStreak =
      totalUsers > 0
        ? longestStreaks.reduce((a, b) => a + b, 0) / totalUsers
        : 0;

    const totalFreezesUsed = streaks.reduce(
      (sum, s) => sum + (3 - s.freezesRemaining),
      0,
    );

    return {
      totalUsers,
      avgCurrentStreak: Math.round(avgCurrentStreak * 100) / 100,
      avgLongestStreak: Math.round(avgLongestStreak * 100) / 100,
      maxCurrentStreak: Math.max(...currentStreaks, 0),
      maxLongestStreak: Math.max(...longestStreaks, 0),
      totalFreezesUsed,
      totalCheckIns: checkIns.length,
      totalXpFromStreaks: checkIns.reduce((sum, c) => sum + c.xpEarned, 0),
    };
  }

  /**
   * Reset a user's streak
   */
  async resetUserStreak(userId: string) {
    const userStreak = await prisma.userStreak.findUnique({
      where: { userId },
    });

    if (!userStreak) {
      throw new HttpError(404, "User streak record not found");
    }

    const oldStreak = userStreak.currentStreak;

    const updated = await prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: 0,
        lastActivityAt: new Date(),
      },
    });

    return {
      ...updated,
      oldStreak,
      message: `Reset streak from ${oldStreak} days to 0 for user ${userId}`,
    };
  }

  /**
   * Award bonus XP to a user
   */
  async awardBonusXp(userId: string, xpAmount: number, reason: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        xp: user.xp + xpAmount,
      },
    });

    // Create a streak check-in to record this bonus
    const userStreak = await prisma.userStreak.findUnique({
      where: { userId },
    });
    if (userStreak) {
      await prisma.streakCheckIn.create({
        data: {
          userId,
          date: new Date(),
          xpEarned: xpAmount,
          lessonCount: 0,
          quizCount: 0,
        },
      });
    }

    return {
      user: updated,
      xpAwarded: xpAmount,
      reason,
      message: `Awarded ${xpAmount} XP to user ${userId}: ${reason}`,
    };
  }

  /**
   * Freeze a user's streak (admin action)
   */
  async freezeUserStreak(userId: string) {
    const userStreak = await prisma.userStreak.findUnique({
      where: { userId },
    });

    if (!userStreak) {
      throw new HttpError(404, "User streak record not found");
    }

    if (userStreak.freezesRemaining <= 0) {
      throw new HttpError(400, "User has no freezes remaining");
    }

    const updated = await prisma.userStreak.update({
      where: { userId },
      data: {
        freezesRemaining: userStreak.freezesRemaining - 1,
        streakFrozenUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    return {
      ...updated,
      message: `Froze streak for user ${userId}. Freezes remaining: ${updated.freezesRemaining}`,
    };
  }

  /**
   * Get character unlock statistics
   */
  async getCharacterStats() {
    const characters = await prisma.character.findMany();
    const unlocks = await prisma.collectedCharacter.findMany();

    const totalUsers = await prisma.user.count();

    const stats = characters.map((char) => {
      const collected = unlocks.filter((u) => u.characterId === char.id).length;
      const unlockPercentage =
        totalUsers > 0 ? Math.round((collected / totalUsers) * 10000) / 100 : 0;

      return {
        characterId: char.id,
        characterName: char.name,
        rarityLevel: char.rarityLevel,
        totalUnlocks: collected,
        unlockPercentage,
        imageUrl: char.imageUrl,
      };
    });

    return {
      data: stats.sort((a, b) => b.totalUnlocks - a.totalUnlocks),
      totalCharacters: characters.length,
      totalUnlocks: unlocks.length,
      avgUnlocksPerCharacter:
        characters.length > 0
          ? Math.round((unlocks.length / characters.length) * 100) / 100
          : 0,
    };
  }

  /**
   * Manually unlock a character for a user
   */
  async unlockCharacterForUser(userId: string, characterId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new HttpError(404, "Character not found");
    }

    // Check if already unlocked
    const existing = await prisma.collectedCharacter.findUnique({
      where: {
        userId_characterId: {
          userId,
          characterId,
        },
      },
    });

    if (existing) {
      return {
        character,
        message: `Character ${character.name} already unlocked for user ${userId}`,
        alreadyUnlocked: true,
      };
    }

    const unlocked = await prisma.collectedCharacter.create({
      data: {
        userId,
        characterId,
        collectedAt: new Date(),
      },
      include: {
        character: true,
      },
    });

    return {
      ...unlocked,
      message: `Unlocked character ${character.name} for user ${userId}`,
      alreadyUnlocked: false,
    };
  }

  /**
   * Get gamification configuration
   */
  async getGamificationConfig() {
    // This would typically come from a config table or environment
    // For now, return hardcoded defaults that can be stored in DB later
    return {
      hearts: {
        maxHearts: 5,
        recoveryTimeMs: 3600000, // 1 hour
        premiumRecoveryTimeMs: 1800000, // 30 minutes
      },
      streaks: {
        checkInHours: 24,
        xpMultiplierFormula: "1 + (currentStreak / 100)",
        milestones: [7, 14, 30, 60, 100, 365],
      },
      characters: {
        unlockXpThreshold: 100,
        purchaseXpCost: 50,
      },
      gamification: {
        enabled: true,
        eventMultiplier: 1.0,
      },
    };
  }

  /**
   * Update gamification configuration
   */
  async updateGamificationConfig(newConfig: any) {
    // Validate config
    if (newConfig.hearts?.maxHearts) {
      if (newConfig.hearts.maxHearts < 1 || newConfig.hearts.maxHearts > 10) {
        throw new HttpError(400, "Max hearts must be between 1 and 10");
      }
    }

    if (newConfig.hearts?.recoveryTimeMs) {
      if (newConfig.hearts.recoveryTimeMs < 300000) {
        throw new HttpError(
          400,
          "Recovery time must be at least 5 minutes (300000ms)",
        );
      }
    }

    // Return updated config (in real implementation, would save to DB)
    const config = await this.getGamificationConfig();
    return {
      ...config,
      ...newConfig,
      message: "Configuration updated successfully",
    };
  }

  /**
   * Create a special event with multiplier
   */
  async createGameEvent(
    eventName: string,
    multiplier: number,
    durationHours: number,
    affectedSystem: "hearts" | "xp" | "all",
  ) {
    if (multiplier < 0.5 || multiplier > 10) {
      throw new HttpError(400, "Multiplier must be between 0.5 and 10");
    }

    if (durationHours < 1 || durationHours > 720) {
      throw new HttpError(400, "Duration must be between 1 hour and 30 days");
    }

    return {
      eventId: `event_${Date.now()}`,
      eventName,
      multiplier,
      affectedSystem,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
      message: `Event "${eventName}" created with ${multiplier}x multiplier for ${durationHours} hours`,
    };
  }

  /**
   * Get user's full gamification profile
   */
  async getUserGamificationProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        xp: true,
      },
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const [hearts, streak, characters] = await Promise.all([
      prisma.userHearts.findUnique({
        where: { userId },
      }),
      prisma.userStreak.findUnique({
        where: { userId },
      }),
      prisma.collectedCharacter.findMany({
        where: { userId },
        include: {
          character: true,
        },
      }),
    ]);

    return {
      user,
      hearts: {
        ...hearts,
        nextRecoveryAt: hearts ? this.calculateNextRecoveryTime(hearts) : null,
      },
      streak,
      collectedCharacters: characters,
      totalCharactersCollected: characters.length,
    };
  }

  /**
   * Bulk restore hearts for all users
   */
  async bulkRestoreHearts(heartsPerUser: number = 5) {
    const result = await prisma.userHearts.updateMany({
      data: {
        hearts: heartsPerUser,
        lastHeartLossAt: null,
      },
    });

    return {
      usersUpdated: result.count,
      heartsPerUser,
      message: `Restored ${heartsPerUser} hearts for ${result.count} users`,
    };
  }

  /**
   * Private helper to calculate next recovery time
   */
  private calculateNextRecoveryTime(userHearts: any) {
    if (userHearts.hearts >= userHearts.maxHearts) {
      return new Date(); // Already full
    }

    if (!userHearts.lastHeartLossAt) {
      return new Date();
    }

    const recoveryTimeMs = 3600000; // 1 hour
    return new Date(userHearts.lastHeartLossAt.getTime() + recoveryTimeMs);
  }
}

export const gamificationAdminService = new GamificationAdminService();
