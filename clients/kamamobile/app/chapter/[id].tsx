import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  type StyleProp,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import {
  VideoView,
  setVideoCacheSizeAsync,
  useVideoPlayer,
  type VideoSource,
} from "expo-video";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StepRenderer } from "@/components/chapter/StepRenderer";
import { kama } from "../../lib/kama-api";
import type { Chapter, ChapterStep } from "@/lib/types";
import { ChapterIntroStep } from "../../components/steps/ChapterIntroStep";
import { ContinueButtonStep } from "../../components/steps/ContinueButtonStep";
import { storyTheme } from "../../components/ui/story-theme";
import { useChapterProgress } from "../../hooks/useChapterProgress";
// import { useLessonEffects } from "../../hooks/useLessonEffects";
import { completeLesson } from "../../lib/api";
import { loadToken } from "../../lib/auth/token-storage";
import { AnimatedLessonProgressBar } from "../../components/lesson/AnimatedLessonProgressBar";
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useLocale } from "@/lib/auth/locale-context";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { getParagraphs } from "@/components/steps/story-ui";
import { LanguageAudioSettings } from "@/components/settings/LanguageAudioSettings";
import { normalizeRemoteMediaUrl } from "@/lib/media-url";

const AUTO_CONTINUE_SECONDS = 3;
const MIN_NARRATION_START_DELAY_MS = 2000;
const VIDEO_CACHE_SIZE_BYTES = 512 * 1024 * 1024;
const NARRATIVE_FOOTER_STEP_TYPES = new Set([
  "TEXT",
  "TEXT_AUDIO",
  "IMAGE_FULL",
  "RECAP",
  "CONTINUE_BUTTON",
]);

function ChapterHeroVideo({
  uri,
  fallbackUri,
  style,
  onPlayingChange,
  onEnded,
}: {
  uri: string;
  fallbackUri?: string | null;
  style?: StyleProp<ViewStyle>;
  onPlayingChange: (playing: boolean) => void;
  onEnded: () => void;
}) {
  const [showFallback, setShowFallback] = useState(true);
  const canCache =
    /\.(mp4|mov|m4v|webm)(?:$|[?#])/i.test(uri) &&
    !/\.m3u8(?:$|[?#])/i.test(uri);
  const source = useMemo<VideoSource>(
    () =>
      canCache
        ? {
            uri,
            useCaching: true,
            contentType: "progressive",
          }
        : { uri },
    [canCache, uri],
  );
  const player = useVideoPlayer(source, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.volume = 0;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  useEffect(() => {
    player.volume = 0;
    player.muted = true;
    player.play();
  }, [player]);

  useEffect(() => {
    const playingSubscription = player.addListener("playingChange", (event) => {
      setShowFallback(!event.isPlaying);
      onPlayingChange(event.isPlaying);
    });
    const statusSubscription = player.addListener("statusChange", (event) => {
      if (event.status === "error") {
        setShowFallback(true);
        onPlayingChange(false);
        return;
      }

      if (event.status === "readyToPlay") {
        player.play();
      }
    });
    const endedSubscription = player.addListener("playToEnd", () => {
      onPlayingChange(false);
      onEnded();
    });

    return () => {
      playingSubscription.remove();
      statusSubscription.remove();
      endedSubscription.remove();
    };
  }, [onEnded, onPlayingChange, player]);

  return (
    <>
      {showFallback ? (
        <View style={styles.videoFallback}>
          {fallbackUri ? (
            <Image
              source={{ uri: fallbackUri }}
              style={styles.heroMedia}
              contentFit="cover"
            />
          ) : null}
          <View style={styles.videoFallbackShade} />
          <ActivityIndicator color={storyTheme.white} />
        </View>
      ) : null}
      <VideoView
        player={player}
        style={[
          style ?? styles.heroMedia,
          showFallback && styles.heroMediaHidden,
        ]}
        nativeControls={false}
        contentFit="cover"
      />
    </>
  );
}

function getNarrationTextForStep(step: ChapterStep | null): string {
  if (!step) return "";

  const content = step.content ?? {};

  switch (step.type) {
    case "TEXT":
    case "TEXT_AUDIO":
      return [
        content.title,
        content.subtitle,
        ...getParagraphs(content.body, content.details),
        content.callout,
      ]
        .filter(Boolean)
        .join("\n\n");
    case "IMAGE_FULL":
      return [
        content.title,
        content.subtitle,
        ...getParagraphs(content.description, content.body),
      ]
        .filter(Boolean)
        .join("\n\n");
    case "RECAP":
      return [content.title, content.subtitle, ...(content.points ?? [])]
        .filter(Boolean)
        .join("\n\n");
    case "CONTINUE_BUTTON":
      return [content.title, content.subtitle, content.body]
        .filter(Boolean)
        .join("\n\n");
    default:
      return "";
  }
}

function getStepParagraphSlideSource(step: ChapterStep | null): unknown {
  return [step?.content?.paragraphSlides, step?.content?.slides];
}

function readContentUrl(
  content: Record<string, unknown> | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const value = content?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

export default function ChapterPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { currentLanguage } = useLocale();
  const { playState, speak, pause, resume, stop, settings } = useAudioPlayer();
  const {
    id,
    lessonId,
    lessonSlug,
    lessonTitle,
    lessonCoverImage,
    chapterCoverImage,
    mode,
  } = useLocalSearchParams<{
    id: string;
    lessonId: string;
    lessonSlug?: string;
    lessonTitle?: string;
    lessonCoverImage?: string;
    chapterCoverImage?: string;
    mode?: string;
  }>();
  const replayMode = mode === "replay";
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [showPreviewScreen, setShowPreviewScreen] = useState(false);
  const [entryResolved, setEntryResolved] = useState(false);
  const [footerCountdown, setFooterCountdown] = useState<number | null>(null);
  const [pausedAutoAdvance, setPausedAutoAdvance] = useState(false);
  const [replayStepIndex, setReplayStepIndex] = useState(0);
  const [isNarrationPlaying, setIsNarrationPlaying] = useState(false);
  const [isNarrationPending, setIsNarrationPending] = useState(false);
  const [readerAudioPaused, setReaderAudioPaused] = useState(false);
  const [heroVideoBlocking, setHeroVideoBlocking] = useState(false);
  const [paragraphSlidesActive, setParagraphSlidesActive] = useState(false);
  const [soundSettingsVisible, setSoundSettingsVisible] = useState(false);
  const [recordedAudioSignal, setRecordedAudioSignal] = useState({
    pause: 0,
    resume: 0,
    stop: 0,
  });
  const lastAutoNarrationKeyRef = useRef<string | null>(null);
  const narrationDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const backgroundMusicRef = useRef<Audio.Sound | null>(null);
  const backgroundMusicVolumeRef = useRef(settings.backgroundMusicVolume);
  const loadingCoverScale = useSharedValue(1);
  const {
    progress,
    lessonProgress,
    completeChapter,
    advanceStep,
    setStepIndex,
    loading: progressLoading,
    reload,
  } = useChapterProgress(id || "", lessonId || "");
  // const { playEffect } = useLessonEffects();

  useEffect(() => {
    void setVideoCacheSizeAsync(VIDEO_CACHE_SIZE_BYTES).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!id) return;
    setShowPreviewScreen(false);
    setEntryResolved(false);
    setFooterCountdown(null);
    setPausedAutoAdvance(false);
    setReplayStepIndex(0);
    void fetchChapter(id);
  }, [currentLanguage, id, replayMode]);

  useEffect(() => {
    if (!loading) return;

    loadingCoverScale.value = 1;
    loadingCoverScale.value = withTiming(1.08, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [loading, loadingCoverScale]);

  async function fetchChapter(chapterId: string) {
    try {
      setLoading(true);
      const data = await kama.getChapter(chapterId, currentLanguage);
      setChapter(data.chapter);
    } catch (err) {
      console.error("Failed to load chapter:", err);
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = chapter?.steps?.length || 0;
  const currentStepIndex = Math.min(
    replayMode ? replayStepIndex : (progress?.currentStepIndex ?? 0),
    Math.max(totalSteps - 1, 0),
  );
  const currentStep = chapter?.steps?.[currentStepIndex] ?? null;
  const flowReady = entryResolved;
  const isShowingPreview = flowReady && showPreviewScreen;
  const activeStep =
    flowReady && !isShowingPreview && (!progress?.completed || replayMode)
      ? currentStep
      : null;
  const usesNarrativeFooter =
    isShowingPreview ||
    Boolean(activeStep && NARRATIVE_FOOTER_STEP_TYPES.has(activeStep.type));
  const mediaBlocksAutoAdvance =
    isNarrationPending ||
    isNarrationPlaying ||
    heroVideoBlocking ||
    paragraphSlidesActive;
  const progressRatio =
    totalSteps > 0 ? Math.min((currentStepIndex + 1) / totalSteps, 1) : 0;
  const introParagraphSlides = useMemo(
    () => getParagraphs(chapter?.introParagraphSlides ?? chapter?.introText),
    [chapter?.introParagraphSlides, chapter?.introText],
  );
  const introHasParagraphSlides = introParagraphSlides.length > 1;
  const introNarrationText = useMemo(
    () => (introHasParagraphSlides ? "" : introParagraphSlides.join("\n\n")),
    [introHasParagraphSlides, introParagraphSlides],
  );
  const activeStepHasParagraphSlides = Boolean(
    getParagraphs(getStepParagraphSlideSource(activeStep)).length > 1,
  );
  const heroHeight = Math.min(Math.max(windowHeight * 0.48, 320), 460);
  const sheetOverlap = 34;
  const sheetTopOffset = Math.max(heroHeight - sheetOverlap, 220);
  const sheetMinHeight = Math.max(
    windowHeight - sheetTopOffset + sheetOverlap,
    360,
  );
  const stepNarrationText = useMemo(
    () =>
      activeStepHasParagraphSlides ? "" : getNarrationTextForStep(activeStep),
    [activeStep, activeStepHasParagraphSlides],
  );
  const activeBackgroundMusic = useMemo(() => {
    const chapterMusicStep = chapter?.steps?.find((step) => {
      const music =
        step.backgroundMusic && typeof step.backgroundMusic === "object"
          ? step.backgroundMusic
          : null;
      const mediaType = String(step.mediaType ?? "");
      return Boolean(
        music?.url ?? (mediaType !== "audio" ? step.backgroundMusicUrl : null),
      );
    });
    const backgroundMusic =
      chapterMusicStep?.backgroundMusic &&
      typeof chapterMusicStep.backgroundMusic === "object"
        ? chapterMusicStep.backgroundMusic
        : null;
    const url = normalizeRemoteMediaUrl(
      (typeof backgroundMusic?.url === "string" ? backgroundMusic.url : null) ??
        (String(chapterMusicStep?.mediaType ?? "") !== "audio"
          ? chapterMusicStep?.backgroundMusicUrl
          : null),
    );

    if (!url) return null;

    return {
      url,
      volume:
        typeof chapterMusicStep?.backgroundMusicVolume === "number"
          ? chapterMusicStep.backgroundMusicVolume
          : typeof backgroundMusic?.volume === "number"
            ? backgroundMusic.volume
            : 0.3,
    };
  }, [chapter?.steps]);
  const hasRecordedAutoNarration =
    settings.enabled &&
    settings.autoPlay &&
    ((isShowingPreview &&
      !introHasParagraphSlides &&
      Boolean(chapter?.introAudioUrl)) ||
      Boolean(
        !isShowingPreview &&
        !activeStepHasParagraphSlides &&
        activeStep?.type === "TEXT_AUDIO" &&
        activeStep.mediaUrl,
      ));

  const heroMedia = useMemo(() => {
    const mediaStep = isShowingPreview ? null : activeStep;
    const stepVideoUrl = readContentUrl(mediaStep?.content, [
      "videoLowUrl",
      "lowResolutionVideoUrl",
      "videoPreviewUrl",
      "videoUrl",
    ]);

    if (stepVideoUrl) {
      return {
        kind: "video" as const,
        uri: normalizeRemoteMediaUrl(stepVideoUrl) ?? stepVideoUrl,
      };
    }

    if (
      mediaStep?.mediaUrl &&
      (mediaStep.mediaType === "image" || mediaStep.mediaType === "video")
    ) {
      return {
        kind: mediaStep.mediaType,
        uri: normalizeRemoteMediaUrl(mediaStep.mediaUrl) ?? mediaStep.mediaUrl,
      } as const;
    }

    const coverUrl =
      chapter?.coverImage ??
      (typeof chapterCoverImage === "string" ? chapterCoverImage : null) ??
      (typeof lessonCoverImage === "string" ? lessonCoverImage : null);

    if (coverUrl) {
      return {
        kind: "image" as const,
        uri: normalizeRemoteMediaUrl(coverUrl) ?? coverUrl,
      };
    }

    return null;
  }, [
    activeStep?.content,
    activeStep?.mediaType,
    activeStep?.mediaUrl,
    chapter?.coverImage,
    chapterCoverImage,
    isShowingPreview,
    lessonCoverImage,
  ]);
  const readingCanStart = true;
  const mediaFallbackUri =
    normalizeRemoteMediaUrl(
      chapter?.coverImage ??
        (typeof chapterCoverImage === "string" ? chapterCoverImage : null) ??
        (typeof lessonCoverImage === "string" ? lessonCoverImage : null),
    ) ??
    chapter?.coverImage ??
    (typeof chapterCoverImage === "string" ? chapterCoverImage : null) ??
    (typeof lessonCoverImage === "string" ? lessonCoverImage : null);
  const effectiveNarrationStartDelayMs = Math.max(
    MIN_NARRATION_START_DELAY_MS,
    settings.startDelaySeconds * 1000,
  );
  const loadingCoverUri =
    normalizeRemoteMediaUrl(
      (typeof chapterCoverImage === "string" ? chapterCoverImage : null) ??
        chapter?.coverImage ??
        (typeof lessonCoverImage === "string" ? lessonCoverImage : null),
    ) ??
    (typeof chapterCoverImage === "string" ? chapterCoverImage : null) ??
    chapter?.coverImage ??
    (typeof lessonCoverImage === "string" ? lessonCoverImage : null);
  const loadingCoverStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loadingCoverScale.value }],
  }));

  const goToQuizIntroPage = useCallback(() => {
    router.replace({
      pathname: "/chapter/quiz-intro/[id]",
      params: {
        id: id || chapter?.id || "",
        lessonId: lessonId || chapter?.lessonId || "",
        lessonSlug,
        lessonTitle,
        lessonCoverImage,
        chapterCoverImage: chapter?.coverImage,
        mode: replayMode ? "replay" : undefined,
      },
    });
  }, [
    chapter?.id,
    chapter?.lessonId,
    id,
    lessonId,
    lessonSlug,
    lessonTitle,
    lessonCoverImage,
    replayMode,
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
          lessonCoverImage,
          chapterCoverImage: nextChapter.coverImage ?? chapter?.coverImage,
          mode: replayMode ? "replay" : undefined,
        },
      });
      return;
    }

    let xpEarned = 0;
    const token = await loadToken();
    if (token && lessonId) {
      try {
        const result = await completeLesson(token, lessonId);
        xpEarned = result.xpEarned;
      } catch (err) {
        console.error("Failed to mark lesson complete:", err);
      }
    }

    if (lessonSlug) {
      router.replace({
        pathname: "/lesson/completed/[slug]",
        params: {
          slug: lessonSlug,
          lessonId,
          lessonTitle,
          lessonCoverImage,
          xpEarned: String(xpEarned),
          firstChapterId: lessonProgress?.lesson.chapters?.[0]?.id,
        },
      });
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
    lessonCoverImage,
    replayMode,
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
      // await playEffect("continue");

      const isLastStep = currentStepIndex >= Math.max(totalSteps - 1, 0);
      if (isLastStep) {
        if (!replayMode) {
          await markChapterComplete();
        }
        if ((chapter.quizzes?.length ?? 0) > 0) {
          goToQuizIntroPage();
        } else {
          await goToNextChapterOrFinish();
        }
        return;
      }

      if (replayMode) {
        setReplayStepIndex((value) => Math.min(value + 1, totalSteps - 1));
      } else {
        await advanceStep(currentStepIndex);
      }
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
    goToQuizIntroPage,
    markChapterComplete,
    // playEffect,
    replayMode,
    totalSteps,
    transitioning,
  ]);

  const handlePrimaryFooterAction = useCallback(() => {
    if (transitioning || progressLoading) return;

    stop();
    setRecordedAudioSignal((value) => ({ ...value, stop: value.stop + 1 }));
    setIsNarrationPlaying(false);
    setIsNarrationPending(false);
    setReaderAudioPaused(false);
    setParagraphSlidesActive(false);

    if (isShowingPreview) {
      // When clicking continue from intro page, hide preview and move to first step
      setShowPreviewScreen(false);
      // Ensure we start from step 0 in replay mode or ensure progress is set
      if (replayMode) {
        setReplayStepIndex(0);
      }
      return;
    }

    void handleStepComplete();
  }, [
    handleStepComplete,
    isShowingPreview,
    progressLoading,
    replayMode,
    stop,
    transitioning,
  ]);

  const handlePreviousStep = useCallback(() => {
    if (transitioning || progressLoading) return;

    stop();
    setRecordedAudioSignal((value) => ({ ...value, stop: value.stop + 1 }));
    setIsNarrationPlaying(false);
    setIsNarrationPending(false);
    setReaderAudioPaused(false);
    stopAutoContinueCountdown();
    setPausedAutoAdvance(false);

    if (isShowingPreview) {
      if (currentStepIndex > 0) {
        setShowPreviewScreen(false);
      }
      return;
    }

    if (currentStepIndex <= 0) {
      setShowPreviewScreen(true);
      return;
    }

    if (replayMode) {
      setReplayStepIndex((value) => Math.max(value - 1, 0));
      return;
    }

    void setStepIndex(currentStepIndex - 1);
  }, [
    currentStepIndex,
    isShowingPreview,
    progressLoading,
    replayMode,
    setStepIndex,
    stop,
    transitioning,
  ]);

  useEffect(() => {
    if (!chapter || progressLoading || entryResolved) return;

    setShowPreviewScreen(replayMode || !progress?.completed);
    setEntryResolved(true);
  }, [
    chapter,
    entryResolved,
    progress?.completed,
    progressLoading,
    replayMode,
  ]);

  useEffect(() => {
    if (!chapter || !flowReady || !progress?.completed || replayMode) return;

    if ((chapter.quizzes?.length ?? 0) > 0) {
      goToQuizIntroPage();
      return;
    }

    void goToNextChapterOrFinish();
  }, [
    chapter,
    flowReady,
    goToNextChapterOrFinish,
    goToQuizIntroPage,
    progress?.completed,
    replayMode,
  ]);

  useEffect(() => {
    if (!chapter || totalSteps !== 0) return;

    void (async () => {
      if (!replayMode) {
        await markChapterComplete();
      }
      if ((chapter.quizzes?.length ?? 0) > 0) {
        goToQuizIntroPage();
      } else {
        await goToNextChapterOrFinish();
      }
    })();
  }, [
    chapter,
    goToNextChapterOrFinish,
    goToQuizIntroPage,
    markChapterComplete,
    replayMode,
    totalSteps,
  ]);

  useEffect(() => {
    if (
      !usesNarrativeFooter ||
      progressLoading ||
      !flowReady ||
      !readingCanStart
    ) {
      return;
    }
    if (
      footerCountdown !== null ||
      pausedAutoAdvance ||
      mediaBlocksAutoAdvance
    ) {
      return;
    }

    setFooterCountdown(AUTO_CONTINUE_SECONDS);
  }, [
    flowReady,
    footerCountdown,
    mediaBlocksAutoAdvance,
    pausedAutoAdvance,
    progressLoading,
    readingCanStart,
    usesNarrativeFooter,
  ]);

  useEffect(() => {
    setFooterCountdown(null);
  }, [activeStep?.id, id, isShowingPreview]);

  useEffect(() => {
    setHeroVideoBlocking(false);
  }, [activeStep?.id, heroMedia?.kind, heroMedia?.uri, isShowingPreview]);

  useEffect(() => {
    if (isShowingPreview) {
      setParagraphSlidesActive(false);
    }
  }, [isShowingPreview]);

  useEffect(() => {
    stop();
    setIsNarrationPlaying(false);
    setIsNarrationPending(false);
    setReaderAudioPaused(false);
    lastAutoNarrationKeyRef.current = null;
    if (narrationDelayTimeoutRef.current) {
      clearTimeout(narrationDelayTimeoutRef.current);
      narrationDelayTimeoutRef.current = null;
    }
  }, [activeStep?.id, isShowingPreview, stop]);

  useEffect(() => {
    backgroundMusicVolumeRef.current = settings.backgroundMusicVolume;
  }, [settings.backgroundMusicVolume]);

  useEffect(() => {
    let cancelled = false;

    async function playBackgroundMusic() {
      await backgroundMusicRef.current?.unloadAsync().catch(() => undefined);
      backgroundMusicRef.current = null;

      if (!activeBackgroundMusic?.url) {
        return;
      }

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: activeBackgroundMusic.url },
          {
            shouldPlay: true,
            isLooping: true,
            volume: Math.max(
              0,
              Math.min(
                activeBackgroundMusic.volume *
                  backgroundMusicVolumeRef.current,
                1,
              ),
            ),
          },
        );

        if (cancelled) {
          await sound.unloadAsync();
          return;
        }

        backgroundMusicRef.current = sound;
      } catch {
        // Story music is optional; narration and lesson flow should continue.
      }
    }

    void playBackgroundMusic();

    return () => {
      cancelled = true;
      void backgroundMusicRef.current?.unloadAsync().catch(() => undefined);
      backgroundMusicRef.current = null;
    };
  }, [
    activeBackgroundMusic?.url,
    activeBackgroundMusic?.volume,
  ]);

  useEffect(() => {
    const nextVolume = Math.max(
      0,
      Math.min(
        (activeBackgroundMusic?.volume ?? 0.3) * settings.backgroundMusicVolume,
        1,
      ),
    );

    void backgroundMusicRef.current
      ?.setVolumeAsync(nextVolume)
      .catch(() => undefined);
  }, [activeBackgroundMusic?.volume, settings.backgroundMusicVolume]);

  useEffect(() => {
    if (
      !flowReady ||
      pausedAutoAdvance ||
      !hasRecordedAutoNarration ||
      !readingCanStart
    ) {
      return;
    }

    setIsNarrationPending(true);
    stopAutoContinueCountdown();

    const timeout = setTimeout(
      () => {
        setIsNarrationPending(false);
      },
      effectiveNarrationStartDelayMs + 750,
    );

    return () => {
      clearTimeout(timeout);
      setIsNarrationPending(false);
    };
  }, [
    activeStep?.id,
    flowReady,
    hasRecordedAutoNarration,
    isShowingPreview,
    pausedAutoAdvance,
    readingCanStart,
    effectiveNarrationStartDelayMs,
    settings.startDelaySeconds,
  ]);

  useEffect(() => {
    if (
      !flowReady ||
      pausedAutoAdvance ||
      !readingCanStart ||
      !settings.enabled ||
      !settings.autoPlay
    ) {
      return;
    }

    if (hasRecordedAutoNarration) {
      return;
    }

    const narrationText = isShowingPreview
      ? introNarrationText
      : stepNarrationText;
    const narrationKey = isShowingPreview
      ? `preview:${chapter?.id ?? id}`
      : (activeStep?.id ?? null);

    if (!narrationText || !narrationKey) {
      return;
    }

    if (lastAutoNarrationKeyRef.current === narrationKey) {
      return;
    }

    lastAutoNarrationKeyRef.current = narrationKey;
    setIsNarrationPending(true);
    stopAutoContinueCountdown();

    narrationDelayTimeoutRef.current = setTimeout(() => {
      setIsNarrationPending(false);
      setIsNarrationPlaying(true);

      void speak(narrationText, () => {
        setIsNarrationPlaying(false);
        if (!pausedAutoAdvance) {
          startAutoContinueCountdown();
        }
      });
    }, effectiveNarrationStartDelayMs);

    return () => {
      if (narrationDelayTimeoutRef.current) {
        clearTimeout(narrationDelayTimeoutRef.current);
        narrationDelayTimeoutRef.current = null;
      }
      setIsNarrationPending(false);
    };
  }, [
    activeStep?.id,
    activeStep?.mediaUrl,
    activeStep?.type,
    chapter?.id,
    chapter?.introAudioUrl,
    flowReady,
    hasRecordedAutoNarration,
    id,
    introNarrationText,
    isShowingPreview,
    pausedAutoAdvance,
    readingCanStart,
    effectiveNarrationStartDelayMs,
    settings.autoPlay,
    settings.enabled,
    settings.startDelaySeconds,
    speak,
    stepNarrationText,
  ]);

  useEffect(() => {
    if (!usesNarrativeFooter || footerCountdown === null || pausedAutoAdvance)
      return;

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
  }, [
    footerCountdown,
    handlePrimaryFooterAction,
    pausedAutoAdvance,
    usesNarrativeFooter,
  ]);

  function startAutoContinueCountdown() {
    if (!usesNarrativeFooter) return;
    if (mediaBlocksAutoAdvance) return;
    setPausedAutoAdvance(false);
    setFooterCountdown((value) =>
      typeof value === "number" && value > 0 ? value : AUTO_CONTINUE_SECONDS,
    );
  }

  function stopAutoContinueCountdown() {
    setFooterCountdown(null);
  }

  function handleNarrationStart() {
    setIsNarrationPlaying(true);
    setIsNarrationPending(false);
    setReaderAudioPaused(false);
    stopAutoContinueCountdown();
  }

  function handleNarrationEnd() {
    setIsNarrationPlaying(false);
    setIsNarrationPending(false);
    setReaderAudioPaused(false);
    if (!pausedAutoAdvance) {
      startAutoContinueCountdown();
    }
  }

  const handleHeroPlayingChange = useCallback((playing: boolean) => {
    setHeroVideoBlocking(playing);
    if (playing) {
      stopAutoContinueCountdown();
    }
  }, []);

  const handleHeroVideoEnded = useCallback(() => {
    setHeroVideoBlocking(false);
  }, []);

  function leaveChapter() {
    stop();
    setRecordedAudioSignal((value) => ({ ...value, stop: value.stop + 1 }));
    setIsNarrationPending(false);
    setReaderAudioPaused(false);
    stopAutoContinueCountdown();

    if (lessonSlug) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/lesson/${lessonSlug}`);
      }
      return;
    }

    router.back();
  }

  if (loading || !chapter) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={[]}>
        {loadingCoverUri ? (
          <Animated.Image
            source={{ uri: loadingCoverUri }}
            style={[styles.loadingCoverImage, loadingCoverStyle]}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.loadingShade} />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={storyTheme.white} />
          <Text style={styles.loadingTitle}>Opening chapter</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={leaveChapter} style={styles.topIcon}>
          <MaterialIcons name="arrow-back-ios-new" size={18} color="#fff" />
        </Pressable>

        {!isShowingPreview && flowReady ? (
          <View style={styles.progressBlock}>
            <AnimatedLessonProgressBar
              value={Math.max(progressRatio, 0.04)}
              height={12}
            />
          </View>
        ) : null}
        <View style={styles.topActions}>
          <Pressable
            style={styles.soundButton}
            onPress={() => {
              setSoundSettingsVisible(true);
            }}
          >
            <MaterialIcons name="volume-up" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.lessonSurface}>
        {heroMedia ? (
          <View style={[styles.mediaPanel, { height: heroHeight }]}>
            <View style={styles.mediaFrame}>
              {heroMedia.kind === "video" ? (
                <ChapterHeroVideo
                  key={heroMedia.uri}
                  uri={heroMedia.uri}
                  fallbackUri={mediaFallbackUri}
                  style={styles.heroMedia}
                  onPlayingChange={handleHeroPlayingChange}
                  onEnded={handleHeroVideoEnded}
                />
              ) : (
                <Image
                  source={{ uri: heroMedia.uri }}
                  style={styles.heroMedia}
                  contentFit="cover"
                />
              )}
            </View>
          </View>
        ) : null}

        <ScrollView
          style={styles.textScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: sheetTopOffset,
              paddingBottom: usesNarrativeFooter ? insets.bottom + 150 : 36,
            },
          ]}
        >
          <View style={[styles.body, { minHeight: sheetMinHeight }]}>
            <View
              style={
                isShowingPreview ? styles.introCardFull : styles.sectionCard
              }
            >
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
                  introParagraphSlides={introParagraphSlides}
                  introAudioUrl={chapter.introAudioUrl}
                  heroBackgroundColor={storyTheme.plum}
                  onAudioStart={handleNarrationStart}
                  onAudioFinished={handleNarrationEnd}
                  pauseAudioSignal={recordedAudioSignal.pause}
                  resumeAudioSignal={recordedAudioSignal.resume}
                  stopAudioSignal={recordedAudioSignal.stop}
                  readingEnabled={readingCanStart}
                  onParagraphSlidesStateChange={({ hasSlides, completed }) => {
                    setParagraphSlidesActive(hasSlides && !completed);
                    if (hasSlides && !completed) {
                      stopAutoContinueCountdown();
                    }
                  }}
                />
              ) : null}

              {activeStep ? (
                <Animated.View entering={FadeInUp.duration(320)}>
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
                    onAudioStart={handleNarrationStart}
                    onAudioFinished={handleNarrationEnd}
                    pauseAudioSignal={recordedAudioSignal.pause}
                    resumeAudioSignal={recordedAudioSignal.resume}
                    stopAudioSignal={recordedAudioSignal.stop}
                    readingEnabled={readingCanStart}
                    onParagraphSlidesStateChange={({ hasSlides, completed }) => {
                      setParagraphSlidesActive(hasSlides && !completed);
                      if (hasSlides && !completed) {
                        stopAutoContinueCountdown();
                      }
                    }}
                  />
                </Animated.View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </View>

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
              !isShowingPreview && activeStep ? "Previous step" : undefined
            }
            secondaryIconOnly
            onSecondaryPress={
              !isShowingPreview && activeStep ? handlePreviousStep : undefined
            }
            countdownSeconds={footerCountdown}
            countdownPaused={pausedAutoAdvance}
            countdownLabel={
              isShowingPreview ? "Auto starting chapter" : "Auto continuing"
            }
            loading={transitioning || progressLoading}
            disabled={paragraphSlidesActive}
          />
        </View>
      ) : null}
      <LanguageAudioSettings
        visible={soundSettingsVisible}
        onClose={() => setSoundSettingsVisible(false)}
        isNarrationPlaying={isNarrationPlaying || playState.isPlaying}
        isNarrationPaused={playState.isPaused || readerAudioPaused}
        onPauseNarration={() => {
          stopAutoContinueCountdown();
          setPausedAutoAdvance(true);
          setIsNarrationPlaying(false);
          setIsNarrationPending(false);
          setReaderAudioPaused(true);
          setRecordedAudioSignal((value) => ({
            ...value,
            pause: value.pause + 1,
          }));
          if (narrationDelayTimeoutRef.current) {
            clearTimeout(narrationDelayTimeoutRef.current);
            narrationDelayTimeoutRef.current = null;
          }
          void pause();
          // void playEffect("pause");
        }}
        onResumeNarration={() => {
          setPausedAutoAdvance(false);
          setIsNarrationPlaying(true);
          setIsNarrationPending(false);
          setReaderAudioPaused(false);
          setRecordedAudioSignal((value) => ({
            ...value,
            resume: value.resume + 1,
          }));
          void resume();
        }}
        onStopNarration={() => {
          stop();
          setIsNarrationPlaying(false);
          setIsNarrationPending(false);
          setReaderAudioPaused(false);
          setRecordedAudioSignal((value) => ({
            ...value,
            stop: value.stop + 1,
          }));
          setPausedAutoAdvance(true);
          stopAutoContinueCountdown();
        }}
      />
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
    backgroundColor: storyTheme.plum,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  loadingCoverImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
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
    color: storyTheme.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
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
  topActions: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  soundButton: {
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
  lessonSurface: {
    flex: 1,
  },
  textScroll: {
    flex: 1,
  },
  mediaBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: storyTheme.plum,
  },
  heroMedia: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroMediaHidden: {
    opacity: 0,
  },
  heroFallback: {
    backgroundColor: storyTheme.plum,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 11, 28, 0.34)",
  },
  mediaPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  mediaFrame: {
    flex: 1,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: storyTheme.plum,
  },
  videoFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: storyTheme.plum,
  },
  videoFallbackShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 11, 28, 0.38)",
  },
  mediaCaption: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    gap: 4,
  },
  mediaEyebrow: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: storyTheme.navy,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: "uppercase",
  },
  mediaTitle: {
    color: storyTheme.white,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
  },
  mediaSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },
  body: {
    backgroundColor: storyTheme.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    paddingTop: 22,
    paddingBottom: 24,
    gap: 20,
  },
  progressBlock: {
    flex: 1,
    marginHorizontal: 16,
    gap: 8,
  },
  progressTrack: {
    minWidth: 120,
  },
  progressText: {
    color: storyTheme.inkSoft,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
  sectionCard: {
    marginHorizontal: 0,
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: storyTheme.line,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 18,
  },
  introCardFull: {
    marginHorizontal: 0,
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: storyTheme.line,
    overflow: "hidden",
    paddingBottom: 18,
    gap: 0,
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
