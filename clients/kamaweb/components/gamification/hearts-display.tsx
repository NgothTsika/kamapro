"use client";

import { useEffect, useState } from "react";
import { Heart, Clock } from "lucide-react";
import { getHearts } from "@/lib/kama-api";
import { UserHeartsResponse } from "@/lib/kama-types";

interface HeartsDisplayProps {
  compact?: boolean;
}

export function HeartsDisplay({ compact = false }: HeartsDisplayProps) {
  const [hearts, setHearts] = useState<UserHeartsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    loadHearts();
    const interval = setInterval(loadHearts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (
      !hearts ||
      hearts.hearts >= hearts.maxHearts ||
      !hearts.timeUntilNextHeartMs
    ) {
      return;
    }

    const updateTimer = () => {
      setHearts((prev) => {
        if (!prev || !prev.timeUntilNextHeartMs) return prev;

        const newTime = Math.max(0, prev.timeUntilNextHeartMs - 1000);
        const minutes = Math.floor(newTime / 60000);
        const seconds = Math.floor((newTime % 60000) / 1000);

        if (newTime === 0) {
          loadHearts(); // Refresh when timer hits 0
        }

        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        return { ...prev, timeUntilNextHeartMs: newTime };
      });
    };

    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [hearts?.timeUntilNextHeartMs]);

  async function loadHearts() {
    try {
      const data = await getHearts();
      setHearts(data);
    } catch (error) {
      console.error("Failed to load hearts:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !hearts) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
        <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        <div className="w-8 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </div>
    );
  }

  const isAtMax = hearts.hearts >= hearts.maxHearts;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
        <span className="text-sm font-semibold text-red-700 dark:text-red-300">
          {hearts.hearts}
        </span>
        {hearts.hearts < hearts.maxHearts && (
          <span className="text-xs text-red-600 dark:text-red-400">
            {timeRemaining}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" fill="currentColor" />
          <span className="font-semibold text-gray-900 dark:text-white">
            {hearts.hearts} / {hearts.maxHearts}
          </span>
          {hearts.isPremium && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold">
              Premium
            </span>
          )}
        </div>
      </div>

      {/* Heart visual indicator */}
      <div className="flex gap-1">
        {[...Array(hearts.maxHearts)].map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i < hearts.hearts ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>

      {/* Recovery info */}
      {!isAtMax && hearts.timeUntilNextHeartMs && (
        <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Next heart in {timeRemaining}</span>
        </div>
      )}

      {isAtMax && (
        <div className="text-xs text-green-600 dark:text-green-400">
          ✓ All hearts recovered
        </div>
      )}
    </div>
  );
}
