"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FileClock,
  FolderOpen,
  Trophy,
  Users,
  BookOpen,
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
import {
  getAdminReports,
  getAdminSubmissions,
  getAchievementsCatalog,
  getAdminLessons,
  getAdminUsers,
} from "@/lib/kama-api";

type DashboardStats = {
  openReports: number;
  pendingSubmissions: number;
  achievements: number;
  users: number;
  lessons: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    openReports: 0,
    pendingSubmissions: 0,
    achievements: 0,
    users: 0,
    lessons: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = getAdminToken();
      if (!token) return;

      try {
        const [reports, submissions, achievements] = await Promise.all([
          getAdminReports(token, "OPEN"),
          getAdminSubmissions(token, "PENDING"),
          getAchievementsCatalog(token),
        ]);
        setStats({
          openReports: reports.total,
          pendingSubmissions: submissions.total,
          achievements: achievements.length,
          lessons: 0,
          users: 0,
        });
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4" />
            Open Reports
          </CardTitle>
          <CardDescription>Items requiring moderation review</CardDescription>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">
          {loading ? "-" : stats.openReports}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileClock className="size-4" />
            Pending Submissions
          </CardTitle>
          <CardDescription>
            Community content waiting for approval
          </CardDescription>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">
          {loading ? "-" : stats.pendingSubmissions}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4" />
            Achievements
          </CardTitle>
          <CardDescription>Rewards currently available in app</CardDescription>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">
          {loading ? "-" : stats.achievements}
        </CardContent>
      </Card>
    </div>
  );
}
