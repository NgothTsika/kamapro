import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StepRenderer } from "./step-renderer";
import { kama } from "../../lib/kama-api";
import type { Chapter } from "../../lib/types";
import { ChapterIntroStep } from "../../components/steps/ChapterIntroStep";
import { ContinueButtonStep } from "../../components/steps/ContinueButtonStep";
import { storyTheme } from "../../components/ui/story-theme";
import { useChapterProgress } from "../../hooks/useChapterProgress";
import { completeLesson } from "../../lib/api";
import { loadToken } from "../../lib/auth/token-storage";

const HERO_HEIGHT = 420;
const AUTO_CONTINUE_SECONDS = 5;
const NARRATIVE_FOOTER_STEP_TYPES = new Set([
  "TEXT",
  "TEXT_AUDIO",
  "IMAGE_FULL",
  "RECAP",
  "CONTINUE_BUTTON",
]);

export default function ChapterPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, lessonId, lessonSlug, lessonTitle } = useLocalSearchParams<{
    id: string;
    lessonId: string;
    lessonSlug?: string;
    lessonTitle?: string;
  }>();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [showPreviewScreen, setShowPreviewScreen] = useState(false);
  const [entryResolved, setEntryResolved] = useState(false);
  const [footerCountdown, setFooterCountdown] = useState<number | null>(null);
  const {
    progress,
    lessonProgress,
    completeChapter,
    advanceStep,
    loading: progressLoading,
    reload,
  } = useChapterProgress(id || "", lessonId || "");

  useEffect(() => {
    if (!id) return;
    setShowPreviewScreen(false);
    setEntryResolved(false);
    setFooterCountdown(null);
    void fetchChapter(id);
  }, [id]);

  async function fetchChapter(chapterId: string) {
    try {
      setLoading(true);
      const data = await kama.getChapter(chapterId);
      setChapter(data.chapter);
    } catch (err) {
      console.error("Failed to load chapter:", err);
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = chapter?.steps?.length || 0;
  const currentStepIndex = Math.min(
    progress?.currentStepIndex || 0,
    Math.max(totalSteps - 1, 0),
  );
  const currentStep = chapter?.steps?.[currentStepIndex] ?? null;
  const hasSavedStepProgress = Boolean(progress && !progress.completed);
  const flowReady =
    entryResolved || hasSavedStepProgress || Boolean(progress?.completed);
  const isShowingPreview =
    flowReady && !progress?.completed && showPreviewScreen;
  const activeStep = flowReady && !isShowingPreview ? currentStep : null;
  const usesNarrativeFooter =
    isShowingPreview ||
    Boolean(activeStep && NARRATIVE_FOOTER_STEP_TYPES.has(activeStep.type));
  const progressRatio =
    totalSteps > 0 ? Math.min((currentStepIndex + 1) / totalSteps, 1) : 0;

  const heroMedia = useMemo(() => {
    if (
      activeStep?.mediaUrl &&
      (activeStep.mediaType === "image" || activeStep.mediaType === "video")
    ) {
      return {
        kind: activeStep.mediaType,
        uri: activeStep.mediaUrl,
      } as const;
    }

    if (chapter?.coverImage) {
      return {
        kind: "image" as const,
        uri: chapter.coverImage,
      };
    }

    return null;
  }, [activeStep?.mediaType, activeStep?.mediaUrl, chapter?.coverImage]);

  const goToQuizPage = useCallback(() => {
    router.replace({
      pathname: "/chapter/quiz/[id]",
      params: {
        id: id || chapter?.id || "",
        lessonId: lessonId || chapter?.lessonId || "",
        lessonSlug,
        lessonTitle,
      },
    });
  }, [
    chapter?.id,
    chapter?.lessonId,
    id,
    lessonId,
    lessonSlug,
    lessonTitle,
    router,
  ]);

  const goToNextChapterOrFinish = useCallback(async () => {
    const nextChapter = lessonProgress?.lesson.chapters.find((item) => {
      const currentOrder = chapter?.order ?? 0;
      return item.order > currentOrder;
    });

    if (nextChapter) {
      router.replace({
        pathname: "/chapter/[id]",
        params: {
          id: nextChapter.id,
          lessonId: lessonId || chapter?.lessonId || "",
          lessonSlug,
          lessonTitle,
        },
      });
      return;
    }

    const token = await loadToken();
    if (token && lessonId) {
      try {
        await completeLesson(token, lessonId);
      } catch (err) {
        console.error("Failed to mark lesson complete:", err);
      }
    }

    if (lessonSlug) {
      router.replace(`/lesson/${lessonSlug}`);
    } else {
      router.back();
    }
  }, [
    chapter?.lessonId,
    chapter?.order,
    lessonId,
    lessonProgress?.lesson.chapters,
    lessonSlug,
    lessonTitle,
    router,
  ]);

  const markChapterComplete = useCallback(async () => {
    if (progress?.completed) {
      await reload();
      return;
    }

    try {
      await completeChapter();
    } catch (err) {
      console.error("Chapter completion returned an error:", err);
      await reload();
    }
  }, [completeChapter, progress?.completed, reload]);

  const handleStepComplete = useCallback(async () => {
    if (!chapter || !activeStep || transitioning) return;

    try {
      setTransitioning(true);
      setFooterCountdown(null);

      const isLastStep = currentStepIndex >= Math.max(totalSteps - 1, 0);
      if (isLastStep) {
        await markChapterComplete();
        if ((chapter.quizzes?.length ?? 0) > 0) {
          goToQuizPage();
        } else {
          await goToNextChapterOrFinish();
        }
        return;
      }

      await advanceStep(currentStepIndex);
    } catch (err) {
      console.error("Failed to progress chapter:", err);
    } finally {
      setTransitioning(false);
    }
  }, [
    activeStep,
    advanceStep,
    chapter,
    currentStepIndex,
    goToNextChapterOrFinish,
    goToQuizPage,
    markChapterComplete,
    totalSteps,
    transitioning,
  ]);

  const handlePrimaryFooterAction = useCallback(() => {
    if (transitioning || progressLoading) return;

    if (isShowingPreview) {
      setShowPreviewScreen(false);
      return;
    }

    void handleStepComplete();
  }, [handleStepComplete, isShowingPreview, progressLoading, transitioning]);

  useEffect(() => {
    if (!chapter || progressLoading || entryResolved) return;

    setShowPreviewScreen(!(hasSavedStepProgress || progress?.completed));
    setEntryResolved(true);
  }, [
    chapter,
    entryResolved,
    hasSavedStepProgress,
    progress?.completed,
    progressLoading,
  ]);

  useEffect(() => {
    if (!chapter || !flowReady || !progress?.completed) return;

    if ((chapter.quizzes?.length ?? 0) > 0) {
      goToQuizPage();
      return;
    }

    void goToNextChapterOrFinish();
  }, [
    chapter,
    flowReady,
    goToNextChapterOrFinish,
    goToQuizPage,
    progress?.completed,
  ]);

  useEffect(() => {
    if (!chapter || totalSteps !== 0) return;

    void (async () => {
      await markChapterComplete();
      if ((chapter.quizzes?.length ?? 0) > 0) {
        goToQuizPage();
      } else {
        await goToNextChapterOrFinish();
      }
    })();
  }, [
    chapter,
    goToNextChapterOrFinish,
    goToQuizPage,
    markChapterComplete,
    totalSteps,
  ]);

  useEffect(() => {
    setFooterCountdown(null);
  }, [activeStep?.id, id, isShowingPreview]);

  useEffect(() => {
    if (!usesNarrativeFooter || footerCountdown === null) return;

    if (footerCountdown === 0) {
      setFooterCountdown(null);
      handlePrimaryFooterAction();
      return;
    }

    const timeout = setTimeout(() => {
      setFooterCountdown((value) =>
        typeof value === "number" ? value - 1 : null,
      );
    }, 1000);

    return () => clearTimeout(timeout);
  }, [footerCountdown, handlePrimaryFooterAction, usesNarrativeFooter]);

  function startAutoContinueCountdown() {
    if (!usesNarrativeFooter) return;
    setFooterCountdown(AUTO_CONTINUE_SECONDS);
  }

  function stopAutoContinueCountdown() {
    setFooterCountdown(null);
  }

  function leaveChapter() {
    if (lessonSlug) {
      router.back();
      return;
    }
    router.back();
  }

  if (loading || !chapter) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={storyTheme.mint} />
      </SafeAreaView>
    );
  }

  const heroHeight = HERO_HEIGHT + insets.top + 24;

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={leaveChapter} style={styles.topIcon}>
          <MaterialIcons name="arrow-back-ios-new" size={18} color="#fff" />
        </Pressable>
        {/* <Text style={styles.topBarTitle}>{chapter.title}</Text>
        <View style={styles.topIconPlaceholder} /> */}
        {!isShowingPreview && flowReady ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(progressRatio, 0.04) * 100}%` },
                ]}
              />
            </View>
          </View>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Pressable onPress={leaveChapter}>
            <MaterialIcons name="volume-up" size={18} color="#fff" />
          </Pressable>
          <Pressable onPress={leaveChapter}>
            <MaterialIcons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: usesNarrativeFooter ? insets.bottom + 150 : 36 },
        ]}
      >
        <View style={[styles.heroWrap, { height: heroHeight }]}>
          {heroMedia?.kind === "video" ? (
            <Video
              source={{ uri: heroMedia.uri }}
              style={styles.heroMedia}
              useNativeControls
              resizeMode={ResizeMode.COVER}
            />
          ) : heroMedia?.kind === "image" ? (
            <Image
              source={{ uri: heroMedia.uri }}
              style={styles.heroMedia}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroMedia, styles.heroFallback]} />
          )}
          <View style={styles.heroShade} />
        </View>

        <View style={styles.body}>
          <View style={styles.sectionCard}>
            {!flowReady ? (
              <View style={styles.loadingPanel}>
                <ActivityIndicator color={storyTheme.navy} />
              </View>
            ) : null}

            {isShowingPreview ? (
              <ChapterIntroStep
                chapterOrder={chapter.order}
                chapterTitle={chapter.title}
                lessonTitle={
                  typeof lessonTitle === "string" ? lessonTitle : undefined
                }
                introText={chapter.introText}
                introAudioUrl={chapter.introAudioUrl}
                onAudioStart={stopAutoContinueCountdown}
                onAudioFinished={startAutoContinueCountdown}
              />
            ) : null}

            {activeStep ? (
              <>
                {/* <View style={styles.chapterMetaBlock}>
                  <Text
                    style={styles.sectionEyebrow}
                  >{`Chapter ${chapter.order}`}</Text>
                  <Text style={styles.sectionTitle}>{chapter.title}</Text>
                  <Text style={styles.sectionCopy}>
                    {lessonTitle ||
                      "Move through the story one scene at a time."}
                  </Text>
                </View> */}

                <StepRenderer
                  step={activeStep}
                  lessonId={lessonId || chapter.lessonId}
                  chapterId={id || chapter.id}
                  onStepComplete={handleStepComplete}
                  useFixedFooter={usesNarrativeFooter}
                  onAudioStart={stopAutoContinueCountdown}
                  onAudioFinished={startAutoContinueCountdown}
                />
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {usesNarrativeFooter ? (
        <View
          style={[styles.footerDock, { paddingBottom: insets.bottom + 12 }]}
        >
          <ContinueButtonStep
            fixed
            label={
              isShowingPreview
                ? "Continue"
                : (activeStep?.content?.buttonLabel ?? "Continue")
            }
            onComplete={handlePrimaryFooterAction}
            secondaryLabel={
              !isShowingPreview && activeStep ? "Preview chapter" : undefined
            }
            secondaryIconOnly
            onSecondaryPress={
              !isShowingPreview && activeStep
                ? () => setShowPreviewScreen(true)
                : undefined
            }
            countdownSeconds={footerCountdown}
            countdownLabel={
              isShowingPreview ? "Auto starting chapter" : "Auto continuing"
            }
            loading={transitioning || progressLoading}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: storyTheme.paper,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: storyTheme.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: storyTheme.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
    color: storyTheme.white,
    fontSize: 16,
    fontWeight: "900",
  },
  topIconPlaceholder: {
    width: 36,
    height: 36,
  },
  content: {
    paddingBottom: 36,
  },
  heroWrap: {
    justifyContent: "flex-end",
    backgroundColor: storyTheme.plum,
  },
  heroMedia: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    backgroundColor: storyTheme.plum,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(38, 4, 31, 0.30)",
  },
  body: {
    marginTop: -26,
    backgroundColor: storyTheme.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 20,
  },
  progressBlock: {
    flex: 1,
    marginHorizontal: 16,
    gap: 8,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: storyTheme.line,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: storyTheme.mint,
  },
  progressText: {
    color: storyTheme.inkSoft,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
  sectionCard: {
    marginHorizontal: 16,
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 20,
    gap: 18,
  },
  chapterMetaBlock: {
    gap: 6,
  },
  sectionEyebrow: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  sectionCopy: {
    color: storyTheme.inkSoft,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
  loadingPanel: {
    paddingVertical: 10,
    alignItems: "center",
  },
  footerDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "rgba(246, 237, 220, 0.97)",
    borderTopWidth: 1,
    borderTopColor: storyTheme.line,
  },
});
