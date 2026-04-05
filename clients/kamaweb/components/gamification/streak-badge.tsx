"use client";

import { useEffect, useState } from "react";
import { Flame, Zap } from "lucide-react";
import { getStreak } from "@/lib/kama-api";
import { UserStreakResponse } from "@/lib/kama-types";

interface StreakBadgeProps {
  compact?: boolean;
}

export function StreakBadge({ compact = false }: StreakBadgeProps) {
  const [streak, setStreak] = useState<UserStreakResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
    const interval = setInterval(loadStreak, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  async function loadStreak() {
    try {
      const data = await getStreak();
      setStreak(data);
    } catch (error) {
      console.error("Failed to load streak:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !streak) {
    return (
      <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
        <Flame className="w-4 h-4 text-orange-500" fill="currentColor" />
        <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
          {streak.current}
        </span>
        {streak.isFrozen && <Zap className="w-3 h-3 text-blue-500" />}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1">
            <Flame className="w-5 h-5 text-orange-500" fill="currentColor" />
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {streak.current}
            </span>
          </div>
          {streak.isFrozen && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Frozen
            </span>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        Best:{" "}
        <span className="font-semibold text-gray-900 dark:text-white">
          {streak.longest}
        </span>
      </div>

      {streak.isFrozen && (
        <div className="text-xs text-blue-600 dark:text-blue-400">
          🧊 Protected for 24 hours
        </div>
      )}

      {!streak.isFrozen && streak.freezesAvailable > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {streak.freezesAvailable} freeze
          {streak.freezesAvailable !== 1 ? "s" : ""} available
        </div>
      )}
    </div>
  );
}
