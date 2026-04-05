"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Flame,
  Users,
  Zap,
  TrendingUp,
  Package,
  Settings,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminToken } from "@/lib/admin-auth";

interface GameificationStats {
  hearts?: {
    totalUsers: number;
    avgHearts: number;
    totalHeartLosses: number;
    usersWithFullHearts: number;
    usersWithNoHearts: number;
  };
  streaks?: {
    totalUsers: number;
    avgCurrentStreak: number;
    avgLongestStreak: number;
    maxCurrentStreak: number;
    totalFreezesUsed: number;
  };
  characters?: {
    totalCharacters: number;
    totalUnlocks: number;
    avgUnlocksPerCharacter: number;
  };
  error?: string;
}

export default function GamificationDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<GameificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      const token = getAdminToken();
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      try {
        const [heartsRes, streaksRes, charactersRes] = await Promise.all([
          fetch("/api/v1/admin/gamification/hearts/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/v1/admin/gamification/streaks/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/v1/admin/gamification/characters/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const hearts = await heartsRes.json();
        const streaks = await streaksRes.json();
        const characters = await charactersRes.json();

        setStats({
          hearts,
          streaks,
          characters,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load statistics",
        );
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading gamification stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Active Users Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" />
              Active Users
            </CardTitle>
            <CardDescription>Total with gamification</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.hearts?.totalUsers || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Users engaged with system
            </p>
          </CardContent>
        </Card>

        {/* Average Streak Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="size-4" />
              Avg Streak
            </CardTitle>
            <CardDescription>Current average</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.round((stats?.streaks?.avgCurrentStreak || 0) * 10) / 10}
            </p>
            <p className="text-xs text-muted-foreground mt-2">days</p>
          </CardContent>
        </Card>

        {/* Hearts Consumed Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="size-4" />
              Hearts Lost
            </CardTitle>
            <CardDescription>Total consumed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.hearts?.totalHeartLosses || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">times</p>
          </CardContent>
        </Card>

        {/* Characters Unlocked Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4" />
              Unlocks
            </CardTitle>
            <CardDescription>Total collected</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.characters?.totalUnlocks || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {(
                ((stats?.characters?.totalUnlocks || 0) /
                  (stats?.hearts?.totalUsers || 1)) *
                100
              ).toFixed(1)}
              % per user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <Heart className="size-5 text-red-500 mb-2" />
            <CardTitle className="text-lg">Hearts</CardTitle>
            <CardDescription>Manage recovery & restoration</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/gamification/hearts">Manage Hearts</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <Flame className="size-5 text-orange-500 mb-2" />
            <CardTitle className="text-lg">Streaks</CardTitle>
            <CardDescription>Reset, freeze, or award XP</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/gamification/streaks">Manage Streaks</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <Package className="size-5 text-purple-500 mb-2" />
            <CardTitle className="text-lg">Characters</CardTitle>
            <CardDescription>View unlocks & analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/gamification/characters">View Characters</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <Sparkles className="size-5 text-yellow-500 mb-2" />
            <CardTitle className="text-lg">Special Events</CardTitle>
            <CardDescription>Create & manage multipliers</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/gamification/events">Manage Events</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <Settings className="size-5 text-blue-500 mb-2" />
            <CardTitle className="text-lg">Settings</CardTitle>
            <CardDescription>System configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/gamification/settings">Configure</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Users at Full Hearts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {stats?.hearts?.usersWithFullHearts || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {(
                  ((stats?.hearts?.usersWithFullHearts || 0) /
                    (stats?.hearts?.totalUsers || 1)) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Longest Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {stats?.streaks?.maxCurrentStreak || 0}
              </p>
              <p className="text-xs text-muted-foreground">days</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Unlocks/Character
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {(stats?.characters?.avgUnlocksPerCharacter || 0).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">users</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
