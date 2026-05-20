import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { kama } from "../../../lib/kama-api";
import type { Chapter } from "../../../lib/types";
import { storyTheme } from "../../../components/ui/story-theme";
import { useChapterProgress } from "../../../hooks/useChapterProgress";
import { useHeartsState } from "../../../hooks/useHeartsState";
import {
  normalizeOptionImages,
  normalizeQuizType,
} from "../../../lib/quiz/normalize";
import {
  ApiError,
  answerQuiz,
  completeLesson,
  startQuizSession,
} from "../../../lib/api";
import { loadToken } from "../../../lib/auth/token-storage";
import { AnimatedLessonProgressBar } from "../../../components/lesson/AnimatedLessonProgressBar";
import { useLocale } from "@/lib/auth/locale-context";
import { useAudioPreferences } from "@/lib/audio/audio-preferences-context";

export default function ChapterQuizPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, lessonId, lessonSlug, lessonTitle, lessonCoverImage, mode } =
    useLocalSearchParams<{
      id: string;
      lessonId: string;
      lessonSlug?: string;
      lessonTitle?: string;
      lessonCoverImage?: string;
      mode?: string;
    }>();
  const replayMode = mode === "replay";
  const { currentLanguage } = useLocale();
  const { preferences } = useAudioPreferences();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [quizQueue, setQuizQueue] = useState<NonNullable<Chapter["quizzes"]>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{
    kind: "correct" | "incorrect" | "failed";
    message: string;
    correctOption?: number | null;
    correctAnswer?: string | null;
    heartsRemaining?: number;
  } | null>(null);
  const [showHeartGate, setShowHeartGate] = useState(false);
  const [heartGateNow, setHeartGateNow] = useState(() => Date.now());
  const {
    hearts: userHearts,
    refresh: refreshHearts,
    setHearts: setUserHearts,
    hasHearts,
  } = useHeartsState();
  const { lessonProgress } = useChapterProgress(id || "", lessonId || "");
  const sessionRequestRef = useRef<Promise<string | null> | null>(null);
  const songSoundRef = useRef<Audio.Sound | null>(null);
  const backgroundMusicRef = useRef<Audio.Sound | null>(null);
  const soundEffectsVolumeRef = useRef(preferences.soundEffectsVolume);
  const backgroundMusicVolumeRef = useRef(preferences.backgroundMusicVolume);

  useEffect(() => {
    soundEffectsVolumeRef.current = preferences.soundEffectsVolume;
  }, [preferences.soundEffectsVolume]);

  useEffect(() => {
    backgroundMusicVolumeRef.current = preferences.backgroundMusicVolume;
  }, [preferences.backgroundMusicVolume]);

  // Play song effect helper function
  const playSongEffect = async (songSource: any, volume = 0.7) => {
    try {
      // Stop any currently playing song
      if (songSoundRef.current) {
        await songSoundRef.current.unloadAsync();
        songSoundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(songSource, {
        shouldPlay: true,
        volume: volume * soundEffectsVolumeRef.current,
      });
      songSoundRef.current = sound;
    } catch (error) {
      console.error("Error playing song effect:", error);
    }
  };

  useEffect(() => {
    if (!id) return;
    void fetchChapter(id);
  }, [currentLanguage, id]);

  useEffect(() => {
    let cancelled = false;

    Audio.Sound.createAsync(require("@/assets/SongEffects/quiz_sound.mp3"), {
      shouldPlay: true,
      isLooping: true,
      volume: 0.18 * backgroundMusicVolumeRef.current,
    })
      .then(({ sound }) => {
        if (cancelled) {
          void sound.unloadAsync();
          return;
        }
        backgroundMusicRef.current = sound;
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (backgroundMusicRef.current) {
        void backgroundMusicRef.current.unloadAsync();
        backgroundMusicRef.current = null;
      }
      if (songSoundRef.current) {
        void songSoundRef.current.unloadAsync();
        songSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    void backgroundMusicRef.current
      ?.setVolumeAsync(0.18 * preferences.backgroundMusicVolume)
      .catch(() => undefined);
  }, [preferences.backgroundMusicVolume]);

  useEffect(() => {
    setQuizQueue(chapter?.quizzes ?? []);
    setCurrentQuizIndex(0);
    setQuizSessionId(null);
    setQuizFeedback(null);
    setSelectedOption(null);
    sessionRequestRef.current = null;
  }, [chapter?.id, chapter?.quizzes]);

  useEffect(() => {
    if (!showHeartGate) return;

    const timer = setInterval(() => {
      setHeartGateNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [showHeartGate]);

  useEffect(() => {
    if (!showHeartGate || !userHearts?.nextRecoveryAt) return;

    if (new Date(userHearts.nextRecoveryAt).getTime() <= heartGateNow) {
      void refreshHearts();
    }
  }, [heartGateNow, refreshHearts, showHeartGate, userHearts?.nextRecoveryAt]);

  async function fetchChapter(chapterId: string) {
    try {
      setLoading(true);
      const data = await kama.getChapter(chapterId, currentLanguage);
      setChapter(data.chapter);
    } catch (err) {
      console.error("Failed to load chapter quiz:", err);
    } finally {
      setLoading(false);
    }
  }

  const chapterQuizzes = quizQueue;
  const currentQuiz = chapterQuizzes[currentQuizIndex];
  const progressRatio =
    chapterQuizzes.length > 0
      ? Math.min((currentQuizIndex + 1) / chapterQuizzes.length, 1)
      : 0;
  const visibleHeartCount = Math.max(0, userHearts?.hearts ?? 0);
  const maxHeartCount = Math.max(visibleHeartCount, userHearts?.maxHearts ?? 3);
  const optionImages = useMemo(
    () =>
      normalizeOptionImages(
        currentQuiz?.optionImages,
        currentQuiz?.options?.length ?? 0,
      ),
    [currentQuiz],
  );
  const quizType =
    normalizeQuizType(currentQuiz?.type) ??
    (optionImages.some(Boolean) ? "image_choice" : "multiple_choice");
  const isTrueFalse = quizType === "true_false";
  const isImageChoice =
    quizType === "image_choice" &&
    optionImages.some(Boolean) &&
    optionImages.length === (currentQuiz?.options?.length ?? 0);
  const hasAnswered = Boolean(quizFeedback);

  const nextHeartLabel = formatTimeRemaining(
    userHearts?.nextRecoveryAt,
    heartGateNow,
  );

  const ensureQuizSession = useCallback(async () => {
    if (!currentQuiz) return null;
    if (quizSessionId) return quizSessionId;
    if (sessionRequestRef.current) return sessionRequestRef.current;

    sessionRequestRef.current = (async () => {
      const token = await loadToken();
      if (!token) return null;

      try {
        const session = await startQuizSession(token, currentQuiz.id);
        setQuizSessionId(session.sessionId);
        return session.sessionId;
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          await refreshHearts();
          setQuizFeedback({
            kind: "failed",
            message:
              "You are out of hearts. Wait for the next one or upgrade to premium when it is available.",
          });
          setShowHeartGate(true);
          return null;
        }
        throw err;
      } finally {
        sessionRequestRef.current = null;
      }
    })();

    return sessionRequestRef.current;
  }, [currentQuiz, quizSessionId, refreshHearts]);

  useEffect(() => {
    if (!currentQuiz || quizFeedback || visibleHeartCount <= 0) return;
    void ensureQuizSession().catch((err) => {
      console.error("Failed to prepare quiz session:", err);
    });
  }, [currentQuiz, ensureQuizSession, quizFeedback, visibleHeartCount]);

  function applyHeartState(nextState?: typeof userHearts | null) {
    if (!nextState) return;
    setUserHearts(nextState);
    setShowHeartGate(nextState.hearts <= 0);
  }

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
    if (!replayMode && token && lessonId) {
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

  async function submitQuizAnswer(optionIndex: number) {
    if (
      !currentQuiz ||
      quizSubmitting ||
      quizFeedback ||
      visibleHeartCount <= 0
    ) {
      if (visibleHeartCount <= 0) setShowHeartGate(true);
      return;
    }

    const token = await loadToken();
    if (!token) return;

    try {
      setQuizSubmitting(true);
      setQuizFeedback(null);
      setSelectedOption(optionIndex);

      let usedLocalValidation = false;
      let localAnswerWasCorrect = false;

      if (typeof currentQuiz.correctOption === "number") {
        usedLocalValidation = true;
        localAnswerWasCorrect = optionIndex === currentQuiz.correctOption;
        setQuizFeedback({
          kind: localAnswerWasCorrect ? "correct" : "incorrect",
          message: localAnswerWasCorrect
            ? currentQuiz.explanation || "Correct. You can move on."
            : currentQuiz.explanation ||
              "Not quite. This one will return at the end.",
          correctOption: currentQuiz.correctOption,
          correctAnswer: currentQuiz.options[currentQuiz.correctOption],
          heartsRemaining: userHearts?.hearts,
        });

        if (!localAnswerWasCorrect) {
          setQuizQueue((current) => [...current, currentQuiz]);
          await playSongEffect(require("@/assets/SongEffects/fail.mp3"), 0.6);
        } else {
          await playSongEffect(require("@/assets/SongEffects/Correct.mp3"), 0.8);
        }

        setQuizSubmitting(false);
      }

      const activeSessionId = await ensureQuizSession();
      if (!activeSessionId) return;

      const result = await answerQuiz(token, activeSessionId, optionIndex);
      applyHeartState(result.heartState);
      if (!result.heartState) {
        await refreshHearts();
      }

      if (usedLocalValidation) {
        setQuizSessionId(null);

        if ((result.heartState?.hearts ?? result.heartsRemaining) <= 0) {
          setQuizFeedback((current) => ({
            kind: "failed",
            message:
              currentQuiz.explanation ||
              "No hearts left. Wait for a heart to recover before you try again.",
            correctOption: result.correctOption ?? current?.correctOption,
            correctAnswer:
              typeof result.correctOption === "number"
                ? currentQuiz.options[result.correctOption]
                : (current?.correctAnswer ?? null),
            heartsRemaining:
              result.heartState?.hearts ?? result.heartsRemaining,
          }));
          setShowHeartGate(true);
        } else if (
          typeof result.heartState?.hearts === "number" ||
          typeof result.heartsRemaining === "number"
        ) {
          setQuizFeedback((current) =>
            current
              ? {
                  ...current,
                  heartsRemaining:
                    result.heartState?.hearts ?? result.heartsRemaining,
                }
              : current,
          );
        }

        return;
      }

      if (result.attempt?.isCorrect) {
        await playSongEffect(require("@/assets/SongEffects/Correct.mp3"), 0.8);
        setQuizFeedback({
          kind: "correct",
          message: currentQuiz.explanation || "Correct. You can move on.",
          correctOption: result.correctOption,
          correctAnswer:
            typeof result.correctOption === "number"
              ? currentQuiz.options[result.correctOption]
              : null,
          heartsRemaining: result.heartState?.hearts,
        });
        setQuizSessionId(null);
        return;
      }

      if (typeof result.correctOption === "number") {
        setQuizQueue((current) => [...current, currentQuiz]);
      }

      if ((result.heartState?.hearts ?? result.heartsRemaining) <= 0) {
        setQuizFeedback({
          kind: "failed",
          message:
            currentQuiz.explanation ||
            "No hearts left. Wait for a heart to recover before you try again.",
          correctOption: result.correctOption,
          correctAnswer:
            typeof result.correctOption === "number"
              ? currentQuiz.options[result.correctOption]
              : null,
          heartsRemaining: result.heartState?.hearts ?? result.heartsRemaining,
        });
        setQuizSessionId(null);
        setShowHeartGate(true);
        return;
      }

      await playSongEffect(require("@/assets/SongEffects/fail.mp3"), 0.6);
      setQuizSessionId(null);
      setQuizFeedback({
        kind: "incorrect",
        message:
          currentQuiz.explanation ||
          "Not quite. This one will return at the end.",
        correctOption: result.correctOption,
        correctAnswer:
          typeof result.correctOption === "number"
            ? currentQuiz.options[result.correctOption]
            : null,
        heartsRemaining: result.heartState?.hearts ?? result.heartsRemaining,
      });
    } catch (err) {
      console.error("Failed to answer quiz:", err);
    } finally {
      setQuizSubmitting(false);
    }
  }

  async function handleAdvanceQuiz() {
    if (currentQuizIndex >= chapterQuizzes.length - 1) {
      await goToNextChapterOrFinish();
      return;
    }

    setCurrentQuizIndex((value) => value + 1);
    setQuizSessionId(null);
    sessionRequestRef.current = null;
    setQuizFeedback(null);
    setSelectedOption(null);
  }

  function leaveQuiz() {
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
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={storyTheme.mint} />
      </SafeAreaView>
    );
  }

  if (!currentQuiz) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={storyTheme.mint} />
      </SafeAreaView>
    );
  }

  const footerAction = quizFeedback
    ? {
        label:
          currentQuizIndex >= chapterQuizzes.length - 1
            ? "Finish quiz"
            : "Next quiz",
        style:
          quizFeedback.kind === "correct"
            ? styles.footerButtonSuccess
            : quizFeedback.kind === "failed" && !hasHearts
              ? styles.footerButtonDisabled
              : styles.footerButtonPrimary,
        onPress: () => void handleAdvanceQuiz(),
        disabled:
          quizSubmitting || (quizFeedback.kind === "failed" && !hasHearts),
      }
    : {
        label: selectedOption === null ? "Choose an answer" : "Checking...",
        style:
          selectedOption === null && !quizSubmitting
            ? styles.footerButtonDisabled
            : styles.footerButtonPrimary,
        onPress: () => undefined,
        disabled: true,
      };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={leaveQuiz} style={styles.topIcon}>
          <MaterialIcons name="close" size={18} color="#fff" />
        </Pressable>
        <View style={styles.progressShell}>
          <AnimatedLessonProgressBar
            value={Math.max(progressRatio, 0.08)}
            height={12}
          />
        </View>
        <View style={styles.heartsRow}>
          {Array.from({ length: maxHeartCount }).map((_, index) => (
            <MaterialIcons
              key={`heart-${index}`}
              name={index < visibleHeartCount ? "favorite" : "favorite-border"}
              size={16}
              color={index < visibleHeartCount ? "#ff6b6b" : "#d7c5d8"}
            />
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 132 },
        ]}
      >
        {/* <View style={styles.heroCard}>
          <Text style={styles.sectionEyebrow}>
            {`Quiz ${currentQuizIndex + 1} of ${Math.max(chapterQuizzes.length, 1)}`}
          </Text>
          <Text style={styles.heroTitle}>{chapter.title}</Text>
          {lessonTitle ? (
            <Text style={styles.heroCopy}>{lessonTitle}</Text>
          ) : null}
        </View> */}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{currentQuiz.question}</Text>
          {currentQuiz.pollDescription ? (
            <Text style={styles.sectionCopy}>
              {currentQuiz.pollDescription}
            </Text>
          ) : null}

          <View
            style={[
              styles.options,
              isTrueFalse && styles.optionsTrueFalse,
              isImageChoice && styles.optionsImageGrid,
            ]}
          >
            {currentQuiz.options.map((option, index) => (
              <Pressable
                key={`${currentQuiz.id}-${index}`}
                onPress={() => void submitQuizAnswer(index)}
                disabled={quizSubmitting || Boolean(quizFeedback)}
                style={({ pressed }) => [
                  styles.optionCard,
                  isTrueFalse && styles.optionCardTrueFalse,
                  isImageChoice && styles.optionCardImageChoice,
                  selectedOption === index && styles.optionCardSelected,
                  hasAnswered &&
                    quizFeedback?.correctOption === index &&
                    styles.optionCardCorrect,
                  hasAnswered &&
                    selectedOption === index &&
                    quizFeedback?.kind !== "correct" &&
                    styles.optionCardIncorrect,
                  pressed && !quizSubmitting ? styles.optionCardPressed : null,
                ]}
              >
                {isImageChoice ? (
                  <ImageOptionCard
                    uri={optionImages[index] ?? undefined}
                    label={option}
                    selected={selectedOption === index}
                    isCorrect={quizFeedback?.correctOption === index}
                  />
                ) : (
                  <Text
                    style={[
                      styles.optionText,
                      isTrueFalse && styles.optionTextTrueFalse,
                    ]}
                  >
                    {option}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>

          <Text style={styles.helperText}>
            {quizFeedback
              ? quizFeedback.kind === "correct"
                ? "Nice. You can move to the next quiz."
                : "This question will come back at the end."
              : selectedOption === null
                ? "Choose one answer."
                : "Checking your answer..."}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footerDock, { paddingBottom: insets.bottom + 12 }]}>
        {quizFeedback ? (
          <View
            style={[
              styles.feedback,
              quizFeedback.kind === "correct"
                ? styles.feedbackCorrect
                : quizFeedback.kind === "failed"
                  ? styles.feedbackFailed
                  : styles.feedbackNeutral,
            ]}
          >
            {quizFeedback.kind !== "correct" && quizFeedback.correctAnswer ? (
              <Text style={styles.feedbackAnswer}>
                {`Correct answer: ${quizFeedback.correctAnswer}`}
              </Text>
            ) : null}
            <Text style={styles.feedbackText}>{quizFeedback.message}</Text>
            {typeof quizFeedback.heartsRemaining === "number" ? (
              <Text style={styles.feedbackMeta}>
                {`Hearts left: ${quizFeedback.heartsRemaining}`}
              </Text>
            ) : null}
          </View>
        ) : null}
        {quizSubmitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={storyTheme.navy} />
          </View>
        ) : null}
        <Pressable
          onPress={footerAction.onPress}
          disabled={footerAction.disabled}
          style={[styles.footerButtonBase, footerAction.style]}
        >
          <Text style={styles.footerButtonText}>{footerAction.label}</Text>
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
            <Text style={styles.modalTitle}>You are out of hearts</Text>
            <Text style={styles.modalCopy}>
              {nextHeartLabel
                ? `Your next heart will be ready in ${nextHeartLabel}.`
                : "A new heart will appear after the recovery timer ends."}
            </Text>
            <View style={styles.modalCountdown}>
              <MaterialIcons name="favorite-border" size={18} color="#d84c4c" />
              <Text style={styles.modalCountdownText}>
                {nextHeartLabel
                  ? `Next heart in ${nextHeartLabel}`
                  : "Recovery timer loading"}
              </Text>
            </View>
            <View style={styles.modalPremiumCard}>
              <Text style={styles.modalPremiumTitle}>Premium</Text>
              <Text style={styles.modalPremiumCopy}>
                Unlimited hearts can plug into this modal next. Ad-based restore
                can also be added here after that.
              </Text>
            </View>
            <Pressable
              onPress={leaveQuiz}
              style={[styles.footerButtonBase, styles.footerButtonPrimary]}
            >
              <Text style={styles.footerButtonText}>Leave quiz</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowHeartGate(false)}
              style={styles.modalSecondaryButton}
            >
              <Text style={styles.modalSecondaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ImageOptionCard({
  uri,
  label,
  selected,
  isCorrect,
}: {
  uri?: string;
  label: string;
  selected?: boolean;
  isCorrect?: boolean;
}) {
  // Show label only if: selected (regardless of correct/incorrect), or all are correct
  const shouldShowLabel = selected || isCorrect;

  return (
    <View style={styles.imageOptionBody}>
      <View style={[styles.imageFrame, selected && styles.imageFrameSelected]}>
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.optionImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.imageFallbackLabel}>Image unavailable</Text>
        )}
      </View>
      {shouldShowLabel && (
        <View
          style={[
            styles.imageLabelWrap,
            selected && styles.imageLabelWrapSelected,
          ]}
        >
          <Text style={styles.imageOptionLabel}>{label}</Text>
        </View>
      )}
    </View>
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  topIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: storyTheme.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  progressShell: {
    flex: 1,
    gap: 6,
  },
  topBarTitle: {
    textAlign: "center",
    color: storyTheme.ink,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heartsRow: {
    minWidth: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
  },
  content: {
    paddingBottom: 36,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: storyTheme.navy,
    borderRadius: 26,
    padding: 20,
    gap: 10,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 20,
    gap: 16,
  },
  sectionEyebrow: {
    color: "#f7dca5",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: storyTheme.white,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  heroCopy: {
    color: "#d9dfee",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: storyTheme.mint,
  },
  sectionTitle: {
    color: storyTheme.ink,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
  },
  sectionCopy: {
    color: storyTheme.inkSoft,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
  options: {
    gap: 12,
    flexDirection: "column",
  },
  optionsTrueFalse: {
    flexDirection: "row",
  },
  optionsImageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  optionCard: {
    backgroundColor: storyTheme.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 16,
  },
  optionCardTrueFalse: {
    flex: 1,
    minHeight: 108,
    justifyContent: "center",
    alignItems: "center",
  },
  optionCardImageChoice: {
    padding: 12,
    width: "48%",
  },
  optionCardSelected: {
    borderColor: storyTheme.navy,
    backgroundColor: "#eef4ff",
  },
  optionCardCorrect: {
    borderColor: storyTheme.mint,
    backgroundColor: "#e8f8eb",
  },
  optionCardIncorrect: {
    borderColor: "#d84c4c",
    backgroundColor: "#ffe8e8",
  },
  optionCardPressed: {
    opacity: 0.9,
  },
  optionText: {
    color: storyTheme.ink,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  optionTextTrueFalse: {
    textAlign: "center",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
  },
  imageOptionBody: {
    gap: 8,
  },
  imageFrame: {
    height: 136,
    borderRadius: 12,
    backgroundColor: "#e8decf",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imageFrameSelected: {
    backgroundColor: "#d4c5b5",
  },
  optionImage: {
    ...StyleSheet.absoluteFillObject,
  },
  imageLabelWrap: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  imageLabelWrapSelected: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  imageFallbackLabel: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  imageOptionLabel: {
    color: storyTheme.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  feedback: {
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  feedbackCorrect: {
    backgroundColor: "#e8f8eb",
    borderWidth: 1,
    borderColor: "#94d3a2",
  },
  feedbackNeutral: {
    backgroundColor: "#fff5de",
    borderWidth: 1,
    borderColor: "#f1d6ac",
  },
  feedbackFailed: {
    backgroundColor: "#ffe8e8",
    borderWidth: 1,
    borderColor: "#e7aaaa",
  },
  feedbackText: {
    color: storyTheme.ink,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
  feedbackAnswer: {
    color: storyTheme.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
  },
  feedbackMeta: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  helperText: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  loadingRow: {
    paddingBottom: 10,
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
    gap: 10,
  },
  footerButtonBase: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  footerButtonPrimary: {
    backgroundColor: storyTheme.navy,
  },
  footerButtonSuccess: {
    backgroundColor: storyTheme.mint,
  },
  footerButtonDanger: {
    backgroundColor: "#d84c4c",
  },
  footerButtonDisabled: {
    backgroundColor: "#b9c0cb",
  },
  footerButtonText: {
    color: storyTheme.white,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(19, 27, 38, 0.52)",
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: storyTheme.white,
    padding: 22,
    gap: 14,
  },
  modalTitle: {
    color: storyTheme.ink,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
  },
  modalCopy: {
    color: storyTheme.inkSoft,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
  modalCountdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: "#fff1f1",
    borderWidth: 1,
    borderColor: "#f2caca",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  modalCountdownText: {
    color: "#b24a4a",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
  },
  modalPremiumCard: {
    borderRadius: 20,
    backgroundColor: "#f3f7ff",
    borderWidth: 1,
    borderColor: "#d2def7",
    padding: 16,
    gap: 6,
  },
  modalPremiumTitle: {
    color: storyTheme.navy,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  modalPremiumCopy: {
    color: storyTheme.ink,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  modalSecondaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryButtonText: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    fontWeight: "800",
  },
});

function formatTimeRemaining(
  nextRecoveryAt?: string | null,
  nowMs = Date.now(),
) {
  if (!nextRecoveryAt) return null;

  const targetMs = new Date(nextRecoveryAt).getTime();
  if (Number.isNaN(targetMs)) return null;

  const diffMs = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.ceil(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
