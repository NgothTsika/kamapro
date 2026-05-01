"use client";

import Link from "next/link";
import {
  BookOpen,
  FolderTree,
  Layers,
  Users,
  HelpCircle,
  Box,
  Map,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const links = [
  {
    title: "Categories",
    description: "Create and order thematic groupings for lessons.",
    href: "/content/categories",
    icon: FolderTree,
  },
  {
    title: "Characters",
    description: "Historical figures, cards, and unlock rules.",
    href: "/content/characters",
    icon: Users,
  },
  {
    title: "Topics",
    description: "Manage topic tags used by lessons, quizzes, and games.",
    href: "/content/topics",
    icon: Layers,
  },
  {
    title: "Lessons",
    description: "Write lessons, chapters, and quizzes for the mobile app.",
    href: "/content/lessons",
    icon: BookOpen,
  },
  {
    title: "Quizzes",
    description:
      "Manage quizzes organized by topic with support for multiple question types.",
    href: "/content/quizzes",
    icon: HelpCircle,
  },
  {
    title: "Collections",
    description: "Create curated collections of lessons for learning.",
    href: "/content/collections",
    icon: Box,
  },
  {
    title: "Roadmap",
    description: "Create ordered levels and assign lessons to each path step.",
    href: "/content/roadmap",
    icon: Map,
  },
];

export default function ContentHubPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="block transition-opacity hover:opacity-90"
        >
          <Card className="h-full">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2">
                <item.icon className="size-5" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </div>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
