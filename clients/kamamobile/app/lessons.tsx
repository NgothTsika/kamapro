import { getLessons, type LessonSummary } from "@/lib";
import { useTabBarScroll } from "@/hooks/useTabBarScroll";
import { kama } from "@/lib/kama-api";
import { loadToken } from "@/lib/auth/token-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { AnimatedLessonProgressBar } from "@/components/lesson/AnimatedLessonProgressBar";

type LessonProgressState = {
  started: boolean;
  completed: boolean;
  value: number;
};

const palette = {
  plum: "#3d0d35",
  plumDark: "#24061f",
  paper: "#f6eddc",
  paperSoft: "#fbf4e7",
  navy: "#263b5e",
  mint: "#58b874",
  ink: "#21314f",
  inkSoft: "#65718c",
  line: "#eadbc4",
};

function LessonTile({
  lesson,
  featured,
  locked,
  status,
  progress,
}: {
  lesson: LessonSummary;
  featured?: boolean;
  locked?: boolean;
  status?: string;
  progress?: LessonProgressState;
}) {
  return (
    <Pressable
      disabled={locked}
      onPress={() =>
        router.push({
          pathname: "/lesson/[slug]",
          params: {
            slug: lesson.slug,
            lessonTitle: lesson.title,
            lessonCoverImage: lesson.coverImage ?? undefined,
          },
        })
      }
      style={({ pressed }) => [
        styles.lessonCard,
        featured && styles.featuredCard,
        locked && styles.lessonCardLocked,
        pressed && styles.lessonCardPressed,
      ]}
    >
      <ImageBackground
        source={lesson.coverImage ? { uri: lesson.coverImage } : undefined}
        style={[styles.lessonHero, featured && styles.featuredHero]}
        imageStyle={styles.lessonHeroImage}
      >
        <View style={styles.lessonHeroShade} />
        {locked ? (
          <View style={styles.lockBadge}>
            <MaterialIcons name="lock" size={15} color="#ffffff" />
            <Text style={styles.lockBadgeText}>Locked</Text>
          </View>
        ) : null}
        {progress?.started || progress?.completed ? (
          <AnimatedLessonProgressBar value={progress.value} height={14} />
        ) : null}
      </ImageBackground>

      <View style={styles.lessonBody}>
        <Text style={styles.lessonEyebrow}>Story Lesson</Text>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.lessonDescription} numberOfLines={featured ? 4 : 3}>
          {lesson.hook ||
            lesson.description ||
            "A vivid historical journey told through short scenes and decisions."}
        </Text>

        <View style={styles.lessonMetaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{lesson.xpReward ?? 0} XP</Text>
          </View>
          <Text style={styles.lessonCTA}>
            {status ?? (featured ? "Continue Story" : "Open Lesson")}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function LessonsScreen() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [inProgressLessonIds, setInProgressLessonIds] = useState<string[]>([]);
  const [progressByLessonId, setProgressByLessonId] = useState<
    Record<string, LessonProgressState>
  >({});
  const { onScroll } = useTabBarScroll();

  useEffect(() => {
    void (async () => {
      try {
        const data = await getLessons();
        setLessons(data);

        const token = await loadToken();
        if (!token) {
          setCompletedLessonIds([]);
          setInProgressLessonIds([]);
          return;
        }

        const progressList = await Promise.all(
          data.map((lesson) =>
            kama
              .getLessonProgress(lesson.id)
              .then((result) => ({
                lessonId: lesson.id,
                progress: result.progress,
              }))
              .catch(() => null),
          ),
        );

        const validProgressList = progressList.filter(
          (item): item is NonNullable<typeof item> => Boolean(item),
        );

        const completed = validProgressList
          .filter((item) =>
            item.progress.lesson.chapters.length > 0 &&
            item.progress.lesson.chapters.every((chapter) =>
              Boolean(chapter.chapterProgress?.[0]?.completed),
            ),
          )
          .map((item) => item.lessonId);

        const inProgress = validProgressList
          .filter(
            (item) =>
              !completed.includes(item.lessonId) &&
              item.progress.lesson.chapters.some((chapter) =>
                Boolean(chapter.chapterProgress?.[0]),
              ),
          )
          .map((item) => item.lessonId);

        const nextProgressByLessonId = validProgressList.reduce<
          Record<string, LessonProgressState>
        >((acc, item) => {
          const chapters = item.progress.lesson.chapters;
          const completedChapters = chapters.filter((chapter) =>
            Boolean(chapter.chapterProgress?.[0]?.completed),
          ).length;
          const hasStarted = chapters.some((chapter) =>
            Boolean(chapter.chapterProgress?.[0]),
          );
          const isCompleted =
            chapters.length > 0 && completedChapters === chapters.length;

          acc[item.lessonId] = {
            started: hasStarted,
            completed: isCompleted,
            value:
              chapters.length > 0
                ? Math.max(completedChapters / chapters.length, hasStarted ? 0.08 : 0)
                : 0,
          };

          return acc;
        }, {});

        setCompletedLessonIds(completed);
        setInProgressLessonIds(inProgress);
        setProgressByLessonId(nextProgressByLessonId);
      } catch {
        setLessons([]);
        setProgressByLessonId({});
      }
    })();
  }, []);

  const [featured, ...others] = useMemo(() => lessons, [lessons]);
  const unlockedLessonIds = useMemo(() => {
    const unlocked = new Set<string>();

    lessons.forEach((lesson, index) => {
      const previousLessonId = index > 0 ? lessons[index - 1]?.id : null;

      if (
        index === 0 ||
        (previousLessonId
          ? completedLessonIds.includes(previousLessonId)
          : false)
      ) {
        unlocked.add(lesson.id);
      }
      if (
        completedLessonIds.includes(lesson.id) ||
        inProgressLessonIds.includes(lesson.id)
      ) {
        unlocked.add(lesson.id);
      }
    });

    return unlocked;
  }, [completedLessonIds, inProgressLessonIds, lessons]);

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={others}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.heroPanel}>
              <Text style={styles.heroEyebrow}>Lessons</Text>
              <Text style={styles.heroTitle}>Story-first learning journeys</Text>
              <Text style={styles.heroCopy}>
                Read each chapter like a living scene, make decisions, then lock
                in what you learned through the step flow.
              </Text>
            </View>

            {featured ? (
              <LessonTile
                lesson={featured}
                featured
                locked={!unlockedLessonIds.has(featured.id)}
                status={
                  completedLessonIds.includes(featured.id)
                    ? "Restart Lesson"
                    : inProgressLessonIds.includes(featured.id)
                      ? "Continue Story"
                      : unlockedLessonIds.has(featured.id)
                        ? "Open Lesson"
                        : "Finish previous lesson"
                }
                progress={progressByLessonId[featured.id]}
              />
            ) : null}

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>More Stories</Text>
              <Text style={styles.sectionCopy}>
                Pick up a new chaptered lesson and jump straight into the story.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <LessonTile
            lesson={item}
            locked={!unlockedLessonIds.has(item.id)}
            status={
              completedLessonIds.includes(item.id)
                ? "Restart Lesson"
                : inProgressLessonIds.includes(item.id)
                  ? "Continue Story"
                  : unlockedLessonIds.has(item.id)
                    ? "Open Lesson"
                    : "Locked"
            }
            progress={progressByLessonId[item.id]}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No lessons yet</Text>
            <Text style={styles.emptyCopy}>
              Once the stories load, they’ll appear here as interactive lesson
              cards.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  headerBlock: {
    gap: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  heroPanel: {
    backgroundColor: palette.plum,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 24,
    overflow: "hidden",
  },
  heroEyebrow: {
    color: "#f5d78f",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    marginBottom: 10,
  },
  heroCopy: {
    color: "#efe4f1",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
  featuredCard: {
    marginBottom: 4,
  },
  lessonCard: {
    backgroundColor: palette.paperSoft,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.line,
  },
  lessonCardLocked: {
    opacity: 0.72,
  },
  lessonCardPressed: {
    opacity: 0.95,
  },
  lessonHero: {
    height: 188,
    justifyContent: "flex-start",
    paddingHorizontal: 14,
    paddingTop: 14,
    backgroundColor: palette.plumDark,
  },
  featuredHero: {
    height: 220,
  },
  lessonHeroImage: {
    resizeMode: "cover",
  },
  lessonHeroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 5, 28, 0.28)",
  },
  lockBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(23, 11, 23, 0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  lockBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  lessonBody: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  lessonEyebrow: {
    color: "#d67d37",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  lessonTitle: {
    color: palette.ink,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  lessonDescription: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 25,
    fontWeight: "500",
  },
  lessonMetaRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaPill: {
    backgroundColor: "#fff4dd",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#f5d7a5",
  },
  metaPillText: {
    color: "#bf7430",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  lessonCTA: {
    color: palette.navy,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionHeading: {
    gap: 6,
    paddingTop: 8,
    paddingBottom: 2,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  sectionCopy: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  emptyCard: {
    marginTop: 30,
    borderRadius: 24,
    backgroundColor: palette.paperSoft,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  emptyCopy: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
});
