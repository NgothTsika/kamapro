import { getLessonBySlug, type LessonFull } from "@/lib";
import { kama } from "@/lib/kama-api";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

const palette = {
  plum: "#3d0d35",
  paper: "#f6eddc",
  paperSoft: "#fbf4e7",
  ink: "#21314f",
  inkSoft: "#65718c",
  line: "#eadbc4",
  navy: "#263b5e",
  mint: "#58b874",
};

function getExcerpt(text?: string | null) {
  if (!text) return "A new scene in the story is ready to unfold.";
  return text.length > 140 ? `${text.slice(0, 140).trim()}...` : text;
}

export default function LessonStoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [lesson, setLesson] = useState<LessonFull | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [completedChapterIds, setCompletedChapterIds] = useState<string[]>([]);

  useEffect(() => {
    if (!slug || typeof slug !== "string") {
      setLesson(null);
      return;
    }

    getLessonBySlug(slug)
      .then(async (result) => {
        setLesson(result);

        try {
          const progressData = await kama.getLessonProgress(result.id);
          const chapters = progressData.progress.lesson.chapters;
          const nextChapter =
            progressData.progress.currentChapter || chapters[0] || null;
          setCurrentChapterId(nextChapter?.id ?? null);
          setCompletedChapterIds(
            chapters
              .filter((chapter) => chapter.chapterProgress?.[0]?.completed)
              .map((chapter) => chapter.id),
          );
        } catch {
          const firstChapter = [...result.chapters].sort(
            (a, b) => a.order - b.order,
          )[0];
          setCurrentChapterId(firstChapter?.id ?? null);
          setCompletedChapterIds([]);
        }
      })
      .catch(() => setLesson(null));
  }, [slug]);

  const sortedChapters = useMemo(
    () => [...(lesson?.chapters ?? [])].sort((a, b) => a.order - b.order),
    [lesson?.chapters],
  );

  if (!lesson) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={palette.mint} />
      </SafeAreaView>
    );
  }

  const startLesson = () => {
    const activeChapter =
      sortedChapters.find((chapter) => chapter.id === currentChapterId) ||
      sortedChapters[0];
    if (!activeChapter) return;

    router.push({
      pathname: "/chapter/[id]",
      params: {
        id: activeChapter.id,
        lessonId: lesson.id,
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
      },
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ImageBackground
          source={lesson.coverImage ? { uri: lesson.coverImage } : undefined}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroShade} />

          <View style={styles.topBar}>
            <Pressable onPress={router.back} style={styles.iconButton}>
              <MaterialIcons
                name="arrow-back-ios-new"
                size={18}
                color="#ffffff"
              />
            </Pressable>
            <Pressable onPress={startLesson} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Story Lesson</Text>
            <Text style={styles.heroTitle}>{lesson.title}</Text>
            <Text style={styles.heroSubtitle}>
              {lesson.hook ||
                lesson.description ||
                "A chaptered lesson told like a cinematic story."}
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.card}>
          <View style={styles.summaryPanel}>
            <Text style={styles.summaryText}>
              {lesson.content ||
                lesson.description ||
                "This story unfolds scene by scene, letting you read, decide, and remember what matters."}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Chapters</Text>
              <Text style={styles.metaValue}>{sortedChapters.length}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Quiz Beats</Text>
              <Text style={styles.metaValue}>{lesson.quizzes.length}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Reward</Text>
              <Text style={styles.metaValue}>{lesson.xpReward}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chapters</Text>
            <Text style={styles.sectionCopy}>
              Move through the story one scene at a time.
            </Text>
          </View>

          <View style={styles.chapterList}>
            {sortedChapters.map((chapter, index) => {
              const isCompleted = completedChapterIds.includes(chapter.id);
              const isCurrent = chapter.id === currentChapterId;
              const isAccessible = isCompleted || isCurrent || index === 0;

              return (
                <Pressable
                  key={chapter.id}
                  disabled={!isAccessible}
                  onPress={() =>
                    router.push({
                      pathname: "/chapter/[id]",
                      params: {
                        id: chapter.id,
                        lessonId: lesson.id,
                        lessonSlug: lesson.slug,
                        lessonTitle: lesson.title,
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.chapterCard,
                    !isAccessible && styles.chapterCardLocked,
                    pressed && styles.chapterCardPressed,
                  ]}
                >
                  <ImageBackground
                    source={
                      lesson.coverImage ? { uri: lesson.coverImage } : undefined
                    }
                    style={styles.chapterHero}
                    imageStyle={styles.chapterHeroImage}
                  >
                    <View style={styles.chapterHeroShade} />
                    <View style={styles.chapterMiniProgress}>
                      <View
                        style={[
                          styles.chapterMiniProgressFill,
                          {
                            width: isCompleted
                              ? "100%"
                              : isCurrent
                                ? "66%"
                                : `${Math.max(18, 100 - index * 14)}%`,
                          },
                        ]}
                      />
                    </View>
                  </ImageBackground>
                  <View style={styles.chapterBody}>
                    <Text style={styles.chapterEyebrow}>
                      Chapter {chapter.order}
                    </Text>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    <Text style={styles.chapterExcerpt}>
                      {getExcerpt(chapter.content)}
                    </Text>
                    <Text style={styles.chapterStatus}>
                      {isCompleted
                        ? "Completed"
                        : isCurrent
                          ? "Continue this chapter"
                          : "Locked next in sequence"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.primaryButton} onPress={startLesson}>
          <Text style={styles.primaryButtonText}>
            {completedChapterIds.length === sortedChapters.length &&
            sortedChapters.length > 0
              ? "Story Complete"
              : completedChapterIds.length > 0
                ? "Continue Story"
                : "Start Lesson"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#21051f",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingBottom: 120,
  },
  hero: {
    height: 360,
    justifyContent: "space-between",
    backgroundColor: palette.plum,
  },
  heroImage: {
    resizeMode: "cover",
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(38, 4, 31, 0.36)",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroCopy: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    gap: 10,
  },
  heroEyebrow: {
    color: "#f3d58f",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: "#f0e7f2",
    fontSize: 16,
    lineHeight: 25,
    fontWeight: "600",
  },
  card: {
    marginTop: -26,
    backgroundColor: palette.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 20,
  },
  summaryPanel: {
    backgroundColor: palette.paperSoft,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 18,
  },
  summaryText: {
    color: palette.ink,
    fontSize: 16,
    lineHeight: 30,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
  },
  metaCard: {
    flex: 1,
    backgroundColor: "#fff8ee",
    borderWidth: 1,
    borderColor: "#f1d6ac",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 4,
  },
  metaLabel: {
    color: "#b8773f",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 26,
    fontWeight: "900",
  },
  sectionCopy: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  chapterList: {
    gap: 16,
  },
  chapterCard: {
    backgroundColor: palette.paperSoft,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.line,
  },
  chapterCardPressed: {
    opacity: 0.95,
  },
  chapterCardLocked: {
    opacity: 0.7,
  },
  chapterHero: {
    height: 170,
    padding: 14,
    backgroundColor: palette.plum,
  },
  chapterHeroImage: {
    resizeMode: "cover",
  },
  chapterHeroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(38, 4, 31, 0.32)",
  },
  chapterMiniProgress: {
    height: 12,
    backgroundColor: "#fff",
    borderRadius: 999,
    overflow: "hidden",
    padding: 2,
  },
  chapterMiniProgressFill: {
    height: "100%",
    backgroundColor: palette.mint,
    borderRadius: 999,
  },
  chapterBody: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 8,
  },
  chapterEyebrow: {
    color: "#d67d37",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  chapterTitle: {
    color: palette.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "900",
  },
  chapterExcerpt: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 25,
    fontWeight: "500",
  },
  chapterStatus: {
    color: palette.navy,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.paper,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: palette.navy,
    borderRadius: 20,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
