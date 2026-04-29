import type { DashboardData } from "@/lib/api";

type WeekdayLabel = "S" | "M" | "T" | "W" | "F";

export type WeeklyActivityItem = {
  key: string;
  label: WeekdayLabel;
  dayNumber: number;
  isComplete: boolean;
  isToday: boolean;
};

export type CalendarDay = {
  key: string;
  value: number | null;
  isComplete: boolean;
  isToday: boolean;
};

export type DerivedBadge = {
  id: string;
  title: string;
  detail: string;
  icon: string;
  accent: string;
  unlocked: boolean;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_LETTERS: Record<number, WeekdayLabel> = {
  0: "S",
  1: "M",
  2: "T",
  3: "W",
  4: "T",
  5: "F",
  6: "S",
};

function atLocalNoon(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function parseDate(input?: string | null) {
  if (!input) {
    return null;
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return atLocalNoon(parsed);
}

function shiftDays(date: Date, days: number) {
  return new Date(date.getTime() + days * ONE_DAY_MS);
}

function toDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function getDisplayName(name?: string | null, limit: number = 18) {
  if (!name) {
    return "Explorer";
  }

  return name.length > limit ? `${name.slice(0, limit - 1)}...` : name;
}

export function getInitials(name?: string | null) {
  if (!name) {
    return "KA";
  }

  const tokens = name.trim().split(/\s+/).slice(0, 2);
  return tokens.map((token) => token.charAt(0).toUpperCase()).join("") || "KA";
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatMemberSince(input?: string | null) {
  const parsed = parseDate(input);
  if (!parsed) {
    return "New learner";
  }

  return parsed.toLocaleDateString("en", {
    month: "short",
    year: "numeric",
  });
}

export function getStreakCompletionSet(
  dashboard: DashboardData | null,
  referenceDate = new Date(),
) {
  const today = atLocalNoon(referenceDate);
  const streakLength = dashboard?.streak?.currentStreak ?? 0;
  const anchor =
    parseDate(dashboard?.streak?.lastCheckInDate) ??
    parseDate(dashboard?.streak?.lastActivityAt) ??
    today;
  const completed = new Set<string>();

  for (let index = 0; index < streakLength; index += 1) {
    completed.add(toDayKey(shiftDays(anchor, -index)));
  }

  return completed;
}

export function buildWeeklyActivity(
  dashboard: DashboardData | null,
  referenceDate = new Date(),
): WeeklyActivityItem[] {
  const today = atLocalNoon(referenceDate);
  const completedDays = getStreakCompletionSet(dashboard, today);

  return Array.from({ length: 7 }, (_, offset) => {
    const date = shiftDays(today, offset - 6);
    const key = toDayKey(date);
    return {
      key,
      label: WEEKDAY_LETTERS[date.getDay()],
      dayNumber: date.getDate(),
      isComplete: completedDays.has(key),
      isToday: key === toDayKey(today),
    };
  });
}

export function buildMonthCalendar(
  dashboard: DashboardData | null,
  referenceDate = new Date(),
): { monthLabel: string; days: CalendarDay[] } {
  const today = atLocalNoon(referenceDate);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1, 12);
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
    12,
  ).getDate();
  const completedDays = getStreakCompletionSet(dashboard, today);
  const days: CalendarDay[] = [];

  for (let index = 0; index < monthStart.getDay(); index += 1) {
    days.push({
      key: `empty-${index}`,
      value: null,
      isComplete: false,
      isToday: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(today.getFullYear(), today.getMonth(), day, 12);
    const key = toDayKey(current);
    days.push({
      key,
      value: day,
      isComplete: completedDays.has(key),
      isToday: key === toDayKey(today),
    });
  }

  return {
    monthLabel: today.toLocaleDateString("en", {
      month: "long",
      year: "numeric",
    }),
    days,
  };
}

export function buildDerivedBadges(dashboard: DashboardData | null) {
  const streak = dashboard?.streak?.currentStreak ?? 0;
  const lessons = dashboard?.stats?.totalLessonsCompleted ?? 0;
  const quizzes = dashboard?.stats?.totalQuizzesCompleted ?? 0;
  const characters = dashboard?.characters?.filter((item) => item.isUnlocked).length ?? 0;

  const badges: DerivedBadge[] = [
    {
      id: "streak",
      title: "Flame Keeper",
      detail: streak >= 7 ? `${streak} day streak live` : "Reach a 7 day streak",
      icon: "local-fire-department",
      accent: "#ff8b4f",
      unlocked: streak >= 7,
    },
    {
      id: "lessons",
      title: "Story Finisher",
      detail: lessons >= 5 ? `${lessons} lessons completed` : "Complete 5 lessons",
      icon: "menu-book",
      accent: "#377dff",
      unlocked: lessons >= 5,
    },
    {
      id: "quizzes",
      title: "Quiz Charger",
      detail: quizzes >= 10 ? `${quizzes} quizzes solved` : "Finish 10 quizzes",
      icon: "psychology",
      accent: "#16a34a",
      unlocked: quizzes >= 10,
    },
    {
      id: "characters",
      title: "Legend Hunter",
      detail: characters >= 3 ? `${characters} legends unlocked` : "Unlock 3 legends",
      icon: "auto-awesome",
      accent: "#d67d37",
      unlocked: characters >= 3,
    },
  ];

  return badges;
}

export function getStreakMessage(dashboard: DashboardData | null) {
  const streak = dashboard?.streak?.currentStreak ?? 0;

  if (streak >= 30) {
    return "Elite consistency. Protect the run with a short lesson today.";
  }

  if (streak >= 7) {
    return "Momentum is real now. One focused session keeps the flame strong.";
  }

  if (streak >= 3) {
    return "A healthy habit is forming. Today is where it starts feeling automatic.";
  }

  if (streak > 0) {
    return "The streak has started. A quick win today will make tomorrow easier.";
  }

  return "Start with one lesson or quiz today and give the streak a base.";
}

export function getWeeklyInsight(dashboard: DashboardData | null) {
  const lessons = dashboard?.stats?.totalLessonsCompleted ?? 0;
  const quizzes = dashboard?.stats?.totalQuizzesCompleted ?? 0;
  const streak = dashboard?.streak?.currentStreak ?? 0;

  if (streak >= 7 && quizzes >= lessons) {
    return "Your consistency is strong, and quizzes are carrying the pace. Keep pairing recall with one story lesson.";
  }

  if (lessons > quizzes) {
    return "Story lessons are leading your growth. Add one quiz after each lesson to lock the facts in faster.";
  }

  if (quizzes > 0) {
    return "You are warming up through quizzes. A short lesson today would deepen retention and protect the streak.";
  }

  return "The cleanest streak strategy is simple: one lesson, one quick quiz, then stop while momentum still feels easy.";
}
