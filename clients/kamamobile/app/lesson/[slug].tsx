import { getLessonBySlug, type LessonFull } from "@/lib";
import { useHeartsState } from "@/hooks/useHeartsState";
import { kama } from "@/lib/kama-api";
import { useLocale } from "@/lib/auth/locale-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  Easing,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ImageBackground } from "expo-image";
import type { UserChapterProgress } from "@/lib/types";

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

const HERO_HEIGHT = 360;

function getExcerpt(text?: string | null) {
  if (!text) return "A new scene in the story is ready to unfold.";
  return text.length > 140 ? `${text.slice(0, 140).trim()}...` : text;
}

function getChapterCover(
  chapter: LessonFull["chapters"][number] | null | undefined,
  fallback?: string | null,
) {
  return (
    (chapter as { coverImage?: string | null } | null | undefined)
      ?.coverImage ?? fallback
  );
}

export default function LessonStoryScreen() {
  const insets = useSafeAreaInsets();
  const { slug, lessonTitle, lessonCoverImage } = useLocalSearchParams<{
    slug: string;
    lessonTitle?: string;
    lessonCoverImage?: string;
  }>();
  const { currentLanguage } = useLocale();
  const [lesson, setLesson] = useState<LessonFull | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [completedChapterIds, setCompletedChapterIds] = useState<string[]>([]);
  const [chapterProgressById, setChapterProgressById] = useState<
    Record<string, UserChapterProgress | undefined>
  >({});
  const [launchingChapter, setLaunchingChapter] = useState<{
    title: string;
    coverImage?: string | null;
  } | null>(null);
  const [completedChapterChoice, setCompletedChapterChoice] = useState<
    LessonFull["chapters"][number] | null
  >(null);
  const [showHeartGate, setShowHeartGate] = useState(false);
  const { hearts, hasHearts } = useHeartsState();
  const scrollY = useSharedValue(0);
  const launchScale = useSharedValue(1);

  useEffect(() => {
    if (!slug || typeof slug !== "string") {
      setLesson(null);
      return;
    }

    getLessonBySlug(slug, currentLanguage)
      .then(async (result) => {
        setLesson(result);

        try {
          const progressData = await kama.getLessonProgress(result.id);
          const chapters = progressData.progress.lesson.chapters;
          const chapterProgressMap = Object.fromEntries(
            chapters.map((chapter) => [
              chapter.id,
              chapter.chapterProgress?.[0],
            ]),
          );
          setChapterProgressById(chapterProgressMap);
          setCurrentChapterId(progressData.progress.currentChapter?.id ?? null);
          setCompletedChapterIds(
            chapters
              .filter((chapter) => chapter.chapterProgress?.[0]?.completed)
              .map((chapter) => chapter.id),
          );
        } catch {
          setCurrentChapterId(null);
          setCompletedChapterIds([]);
          setChapterProgressById({});
        }
      })
      .catch(() => setLesson(null));
  }, [currentLanguage, slug]);

  const sortedChapters = useMemo(
    () => [...(lesson?.chapters ?? [])].sort((a, b) => a.order - b.order),
    [lesson?.chapters],
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroImageStyle = useAnimatedStyle(() => {
    const pullDown = Math.min(scrollY.value, 0);

    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-HERO_HEIGHT, 0, HERO_HEIGHT],
            [-HERO_HEIGHT * 0.2, 0, HERO_HEIGHT * 0.16],
          ),
        },
        {
          scale: interpolate(pullDown, [-HERO_HEIGHT, 0], [1.24, 1]),
        },
      ],
    };
  });

  const overlayHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HERO_HEIGHT * 0.42], [0, 1]),
  }));

  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [HERO_HEIGHT * 0.18, HERO_HEIGHT * 0.42],
      [0, 1],
    ),
  }));

  const titleLiftStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 180], [0, -18]),
      },
    ],
    opacity: interpolate(scrollY.value, [0, 220], [1, 0.2]),
  }));

  const launchImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: launchScale.value }],
  }));

  if (!lesson) {
    const loadingTitle =
      typeof lessonTitle === "string" && lessonTitle.trim()
        ? lessonTitle
        : typeof slug === "string"
          ? slug.replace(/-/g, " ")
          : "Lesson";
    const loadingCover =
      typeof lessonCoverImage === "string" && lessonCoverImage.trim()
        ? lessonCoverImage
        : null;

    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Stack.Screen options={{ headerShown: false }} />
        {loadingCover ? (
          <ImageBackground
            source={{ uri: loadingCover }}
            style={styles.loadingCover}
            contentFit="cover"
          >
            <View style={styles.loadingShade} />
          </ImageBackground>
        ) : (
          <View style={[styles.loadingCover, styles.loadingFallback]} />
        )}
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingTitle}>{loadingTitle}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const openChapter = (
    chapter: LessonFull["chapters"][number],
    options?: { replay?: boolean; skipCompletedPrompt?: boolean },
  ) => {
    if (!hasHearts) {
      setShowHeartGate(true);
      return;
    }

    const coverImage = getChapterCover(chapter, lesson.coverImage);
    const isCompleted = completedChapterIds.includes(chapter.id);
    const hasQuiz = lesson.quizzes.some(
      (quiz) => !quiz.chapterId || quiz.chapterId === chapter.id,
    );

    if (isCompleted && hasQuiz && !options?.skipCompletedPrompt) {
      setCompletedChapterChoice(chapter);
      return;
    }

    setLaunchingChapter({ title: chapter.title, coverImage });
    launchScale.value = 1;
    launchScale.value = withTiming(1.08, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });

    setTimeout(() => {
      router.push({
        pathname: "/chapter/[id]",
        params: {
          id: chapter.id,
          lessonId: lesson.id,
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
          lessonCoverImage: lesson.coverImage ?? undefined,
          chapterCoverImage: coverImage ?? undefined,
          mode: options?.replay ? "replay" : undefined,
        },
      });
    }, 120);
  };

  const openChapterQuiz = (chapter: LessonFull["chapters"][number]) => {
    if (!hasHearts) {
      setShowHeartGate(true);
      return;
    }

    const coverImage = getChapterCover(chapter, lesson.coverImage);
    setCompletedChapterChoice(null);
    router.push({
      pathname: "/chapter/quiz-intro/[id]",
      params: {
        id: chapter.id,
        lessonId: lesson.id,
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
        lessonCoverImage: lesson.coverImage ?? undefined,
        chapterCoverImage: coverImage ?? undefined,
        mode: "replay",
      },
    });
  };

  const startLesson = () => {
    const activeChapter =
      (completedChapterIds.length === sortedChapters.length &&
      sortedChapters.length > 0
        ? sortedChapters[0]
        : sortedChapters.find((chapter) => chapter.id === currentChapterId)) ||
      sortedChapters[0];
    if (!activeChapter) return;

    openChapter(activeChapter, {
      replay:
        completedChapterIds.length === sortedChapters.length &&
        sortedChapters.length > 0,
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={[styles.heroBackdrop, { height: HERO_HEIGHT + insets.top + 24 }]}
      >
        <Animated.Image
          source={lesson.coverImage ? { uri: lesson.coverImage } : undefined}
          style={[styles.heroImageFill, heroImageStyle]}
          resizeMode="cover"
        />
        <View style={styles.heroShade} />
      </View>

      <View style={styles.topBar} pointerEvents="box-none">
        <Animated.View style={[styles.topBarGlass, overlayHeaderStyle]} />
        <View style={[styles.topBarContent, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={router.back} style={styles.topIcon}>
            <MaterialIcons
              name="arrow-back-ios-new"
              size={18}
              color="#ffffff"
            />
          </Pressable>
          <Animated.Text style={[styles.topBarTitle, headerTitleStyle]}>
            {lesson.title}: {lesson.subtitle}
          </Animated.Text>
          <View style={styles.topSpacer} />
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.hero, { height: HERO_HEIGHT + insets.top + 24 }]}>
          <Animated.View style={[styles.heroFooter, titleLiftStyle]}>
            <Text style={styles.heroTitle}>{lesson.title}</Text>
            <Text style={styles.heroCopy}>{lesson.subtitle}</Text>
          </Animated.View>
        </View>

        <View style={styles.card}>
          {lesson.content || lesson.description ? (
            <View style={styles.summaryPanel}>
              <Text style={styles.summaryText}>{lesson.hook}</Text>
            </View>
          ) : null}

          {lesson.content || lesson.description ? (
            <View style={styles.summaryPanel}>
              <Text style={styles.summaryText}>{lesson.description}</Text>
            </View>
          ) : null}

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
              const chapterProgress = chapterProgressById[chapter.id];
              const isCompleted = completedChapterIds.includes(chapter.id);
              const isCurrent = chapter.id === currentChapterId;
              const isAccessible = isCompleted || isCurrent || index === 0;
              const hasStarted = Boolean(chapterProgress) || isCompleted;
              const totalSteps = Math.max(chapter.steps?.length || 0, 1);
              const chapterProgressRatio = isCompleted
                ? 1
                : chapterProgress
                  ? Math.min(chapterProgress.currentStepIndex / totalSteps, 1)
                  : 0;

              return (
                <Pressable
                  key={chapter.id}
                  disabled={!isAccessible}
                  onPress={() => {
                    openChapter(chapter);
                  }}
                  style={({ pressed }) => [
                    styles.chapterCard,
                    !isAccessible && styles.chapterCardLocked,
                    pressed && styles.chapterCardPressed,
                  ]}
                >
                  <ImageBackground
                    source={
                      getChapterCover(chapter, lesson.coverImage)
                        ? { uri: getChapterCover(chapter, lesson.coverImage)! }
                        : undefined
                    }
                    style={styles.chapterHero}
                    contentFit="cover"
                  >
                    <View style={styles.chapterHeroShade} />
                    {!isAccessible ? (
                      <View style={styles.chapterLockBadge}>
                        <MaterialIcons name="lock" size={15} color="#ffffff" />
                        <Text style={styles.chapterLockText}>Locked</Text>
                      </View>
                    ) : null}
                    {hasStarted ? (
                      <View style={styles.chapterMiniProgress}>
                        <View
                          style={[
                            styles.chapterMiniProgressFill,
                            {
                              width: `${chapterProgressRatio * 100}%`,
                            },
                          ]}
                        />
                      </View>
                    ) : null}
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
                          : index === 0
                            ? "Ready to start"
                            : "Locked next in sequence"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Animated.ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.primaryButton,
            !hasHearts && styles.primaryButtonDisabled,
          ]}
          onPress={startLesson}
        >
          <Text style={styles.primaryButtonText}>
            {completedChapterIds.length === sortedChapters.length &&
            sortedChapters.length > 0
              ? "Restart Lesson"
              : completedChapterIds.length > 0
                ? "Continue Story"
                : "Start Lesson"}
          </Text>
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={showHeartGate}
        onRequestClose={() => setShowHeartGate(false)}
      >
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>No hearts left</Text>
            <Text style={styles.modalCopy}>
              You need at least one heart to start or continue this lesson.
            </Text>
            <Text style={styles.modalMeta}>
              {hearts?.nextRecoveryAt
                ? `Next heart: ${new Date(hearts.nextRecoveryAt).toLocaleTimeString()}`
                : "Wait for recovery before coming back."}
            </Text>
            <Pressable
              onPress={() => setShowHeartGate(false)}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(completedChapterChoice)}
        onRequestClose={() => setCompletedChapterChoice(null)}
      >
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chapter complete</Text>
            <Text style={styles.modalCopy}>
              Restart the story scene, or jump straight into the quiz without
              changing your saved progress.
            </Text>
            <Pressable
              onPress={() => {
                const chapter = completedChapterChoice;
                setCompletedChapterChoice(null);
                if (chapter) {
                  openChapter(chapter, {
                    replay: true,
                    skipCompletedPrompt: true,
                  });
                }
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Restart chapter</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (completedChapterChoice) {
                  openChapterQuiz(completedChapterChoice);
                }
              }}
              style={styles.modalSecondaryButton}
            >
              <Text style={styles.modalSecondaryButtonText}>Go to quiz</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    overflow: "hidden",
  },
  loadingCover: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
  },
  loadingFallback: {
    backgroundColor: palette.plum,
  },
  loadingShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 11, 28, 0.58)",
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 28,
    zIndex: 10,
  },
  loadingTitle: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    marginTop: 10,
    textAlign: "center",
    textTransform: "capitalize",
  },
  content: {
    paddingBottom: 120,
  },
  heroBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: palette.paper,
  },
  hero: {
    justifyContent: "space-between",
  },
  heroFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 8,
  },
  heroEyebrow: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.54)",
    backgroundColor: "rgba(255,255,255,0.16)",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    maxWidth: "88%",
  },
  heroCopy: {
    color: "#efe4f1",
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "400",
    maxWidth: "92%",
  },
  heroImageFill: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(38, 4, 31, 0.36)",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  topBarGlass: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.paper,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  topBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  topSpacer: {
    width: 36,
    height: 36,
  },
  card: {
    marginTop: -26,
    backgroundColor: palette.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 24,
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
  chapterLockBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(22, 16, 22, 0.72)",
  },
  chapterLockText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
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
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(18, 25, 34, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: palette.paperSoft,
    padding: 22,
    gap: 10,
  },
  modalTitle: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: "900",
  },
  modalCopy: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  modalMeta: {
    color: palette.inkSoft,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  modalSecondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryButtonText: {
    color: palette.navy,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  launchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: palette.plum,
  },
  launchImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  launchShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 11, 28, 0.62)",
  },
  launchContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 28,
  },
  launchTitle: {
    color: "#ffffff",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    textAlign: "center",
  },
  launchCopy: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
});
