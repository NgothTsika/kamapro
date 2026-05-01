"use client";

import { useEffect, useState } from "react";
import { Heart, Flame, Gift, Trophy, Clock } from "lucide-react";
import {
  getGamificationSummary,
  getHearts,
  getStreak,
  getChallenges,
} from "@/lib/kama-api";
import {
  GamificationSummary,
  UserHeartsResponse,
  UserStreakResponse,
  ChallengesResponse,
} from "@/lib/kama-types";
import { Card } from "@/components/ui/card";

export default function GamificationDashboard() {
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [hearts, setHearts] = useState<UserHeartsResponse | null>(null);
  const [streak, setStreak] = useState<UserStreakResponse | null>(null);
  const [challenges, setChallenges] = useState<ChallengesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recoveryTimer, setRecoveryTimer] = useState<number>(0);

  useEffect(() => {
    loadGamificationData();
    // Refresh every 30 seconds
    const interval = setInterval(loadGamificationData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Recovery timer countdown
  useEffect(() => {
    if (!hearts?.timeUntilNextHeartMs || hearts.timeUntilNextHeartMs === 0) {
      return;
    }

    const timer = setInterval(() => {
      setRecoveryTimer((prev) => {
        if (prev <= 1000) {
          loadGamificationData(); // Refresh when recovery is ready
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hearts?.timeUntilNextHeartMs]);

  async function loadGamificationData() {
    try {
      setLoading(true);
      const [summaryData, heartsData, streakData, challengesData] =
        await Promise.all([
          getGamificationSummary(),
          getHearts(),
          getStreak(),
          getChallenges(),
        ]);

      setSummary(summaryData);
      setHearts(heartsData);
      setStreak(streakData);
      setChallenges(challengesData);
      setRecoveryTimer(heartsData.timeUntilNextHeartMs);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load gamification data",
      );
    } finally {
      setLoading(false);
    }
  }

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hearts Card */}
        <Card className="p-4 bg-linear-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Hearts
            </h3>
            <Heart className="w-5 h-5 text-red-500" fill="currentColor" />
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {hearts?.hearts || 0}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              / {hearts?.maxHearts || 5}
            </span>
          </div>

          {/* Heart recovery timer */}
          {hearts && hearts.hearts < hearts.maxHearts && recoveryTimer > 0 && (
            <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
              <Clock className="w-3 h-3" />
              <span>Next: {formatTimeRemaining(recoveryTimer)}</span>
            </div>
          )}

          {hearts?.isPremium && (
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              ✨ Premium active
            </div>
          )}
        </Card>

        {/* Streak Card */}
        <Card className="p-4 bg-linear-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Streak
            </h3>
            <Flame className="w-5 h-5 text-orange-500" fill="currentColor" />
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {streak?.current || 0}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Best: {streak?.longest || 0}
            </span>
          </div>

          {streak?.isFrozen && (
            <div className="text-xs text-blue-600 dark:text-blue-400">
              🧊 Frozen for 24h
            </div>
          )}
        </Card>

        {/* Characters Card */}
        <Card className="p-4 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Characters
            </h3>
            <Trophy className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {summary?.characters.unlocked || 0}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              unlocked
            </span>
          </div>
        </Card>

        {/* Challenges Card */}
        <Card className="p-4 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Challenges
            </h3>
            <Gift className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {summary?.challenges.completedToday || 0}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              / {summary?.challenges.totalChallenges || 0}
            </span>
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            +{summary?.challenges.xpClaimedToday || 0} XP
          </div>
        </Card>
      </div>

      {/* Challenges Section */}
      {challenges && challenges.total > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Daily Challenges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.challenges.map((challenge) => (
              <Card key={challenge.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {challenge.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {challenge.description}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    +{challenge.xpReward} XP
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      {challenge.progress} / {challenge.targetCount}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {Math.round(challenge.percentComplete)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-linear-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${challenge.percentComplete}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                {challenge.isCompleted && challenge.isRewarded && (
                  <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
                    ✓ Reward Claimed
                  </div>
                )}
                {challenge.isCompleted && !challenge.isRewarded && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    ✓ Ready to Claim
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <Card className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
          Today&apos;s Progress
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Total XP Earned
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary?.challenges.xpClaimedToday || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Challenges Done
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary?.challenges.completedToday || 0}/
              {summary?.challenges.totalChallenges || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Streak Status
            </p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {streak?.current || 0} 🔥
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
