"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { AuthGuard } from "@/components/admin/auth-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import type { ReactNode } from "react";

function getAdminPageMeta(pathname: string): {
  title: string;
  subtitle: string;
} {
  if (pathname === "/content") {
    return {
      title: "Content",
      subtitle: "Manage lessons, categories, and learning materials",
    };
  }
  if (pathname.startsWith("/content/categories")) {
    return {
      title: "Categories",
      subtitle: "Organize content into thematic groups",
    };
  }
  if (pathname.startsWith("/content/topics")) {
    return {
      title: "Topics",
      subtitle: "Topics and subcategories for games and lessons",
    };
  }
  if (pathname === "/content/lessons/new") {
    return { title: "New lesson", subtitle: "Create a new lesson" };
  }
  if (pathname.startsWith("/content/lessons/")) {
    return { title: "Edit lesson", subtitle: "Details, chapters, and quizzes" };
  }
  if (pathname.startsWith("/content/lessons")) {
    return { title: "Lessons", subtitle: "Create and publish learning paths" };
  }
  if (pathname.startsWith("/content/characters/")) {
    return { title: "Edit character", subtitle: "Profile and localized copy" };
  }
  if (pathname === "/content/characters") {
    return {
      title: "Characters",
      subtitle: "Historical figures and collectibles",
    };
  }
  if (pathname === "/users") {
    return { title: "Users", subtitle: "Manage user roles and permissions" };
  }
  if (pathname === "/gamification") {
    return {
      title: "Gamification",
      subtitle: "Hearts, streaks, and character system analytics",
    };
  }
  if (pathname === "/gamification/hearts") {
    return {
      title: "Hearts Management",
      subtitle: "View and restore user hearts",
    };
  }
  if (pathname === "/gamification/streaks") {
    return {
      title: "Streaks Management",
      subtitle: "Manage user streaks, freezes, and awards",
    };
  }
  if (pathname === "/gamification/characters") {
    return {
      title: "Characters Management",
      subtitle: "Character unlock statistics and analytics",
    };
  }
  if (pathname === "/gamification/settings") {
    return {
      title: "Gamification Settings",
      subtitle: "Configure system parameters and events",
    };
  }

  const map: Record<string, { title: string; subtitle: string }> = {
    "/dashboard": {
      title: "Dashboard",
      subtitle: "Overview of moderation and content operations",
    },
    "/moderation": {
      title: "Moderation",
      subtitle: "Review reports and approve or reject submissions",
    },
    "/achievements": {
      title: "Achievements",
      subtitle: "Manage rewards and progression milestones",
    },
  };

  return (
    map[pathname] ?? {
      title: "KamaGame Admin",
      subtitle: "Admin panel",
    }
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = getAdminPageMeta(pathname);

  return (
    <>
      <AuthGuard>
        {({ user }) => (
          <AdminShell user={user} title={meta.title} subtitle={meta.subtitle}>
            {children}
          </AdminShell>
        )}
      </AuthGuard>
      <Toaster richColors position="top-right" />
    </>
  );
}
