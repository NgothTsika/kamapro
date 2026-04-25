import React, { useCallback, useEffect, useMemo, useState } from "react";
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

export default function ChapterQuizPage() {
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
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{
    kind: "correct" | "incorrect" | "failed";
    message: string;
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

  useEffect(() => {
    if (!id) return;
    void fetchChapter(id);
  }, [id]);

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
      const data = await kama.getChapter(chapterId);
      setChapter(data.chapter);
    } catch (err) {
      console.error("Failed to load chapter quiz:", err);
    } finally {
      setLoading(false);
    }
  }

  const chapterQuizzes = chapter?.quizzes ?? [];
  const currentQuiz = chapterQuizzes[currentQuizIndex];
  const progressRatio =
    chapterQuizzes.length > 0
      ? Math.min((currentQuizIndex + 1) / chapterQuizzes.length, 1)
      : 0;
  const visibleHeartCount = Math.max(0, userHearts?.hearts ?? 0);
  const maxHeartCount = Math.max(visibleHeartCount, userHearts?.maxHearts ?? 5);
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
  const canValidate =
    selectedOption !== null &&
    !quizFeedback &&
    !quizSubmitting &&
    visibleHeartCount > 0;

  const nextHeartLabel = formatTimeRemaining(
    userHearts?.nextRecoveryAt,
    heartGateNow,
  );

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

  async function submitQuizAnswer(optionIndex: number) {
    if (!currentQuiz || quizSubmitting) return;

    const token = await loadToken();
    if (!token) return;

    try {
      setQuizSubmitting(true);
      setQuizFeedback(null);

      let activeSessionId = quizSessionId;
      if (!activeSessionId) {
        try {
          const session = await startQuizSession(token, currentQuiz.id);
          activeSessionId = session.sessionId;
          setQuizSessionId(session.sessionId);
        } catch (err) {
          if (err instanceof ApiError && err.status === 400) {
            await refreshHearts();
            setQuizFeedback({
              kind: "failed",
              message:
                "You are out of hearts. Wait for the next one or upgrade to premium when it is available.",
            });
            setShowHeartGate(true);
            return;
          }
          throw err;
        }
      }

      const result = await answerQuiz(token, activeSessionId, optionIndex);
      applyHeartState(result.heartState);
      if (!result.heartState) {
        await refreshHearts();
      }

      if (result.attempt?.isCorrect) {
        setQuizFeedback({
          kind: "correct",
          message: currentQuiz.explanation || "Correct. You can move on.",
          heartsRemaining: result.heartState?.hearts,
        });
        setQuizSessionId(null);
        return;
      }

      if ((result.heartState?.hearts ?? result.heartsRemaining) <= 0) {
        setQuizFeedback({
          kind: "failed",
          message:
            currentQuiz.explanation ||
            "No hearts left. Wait for a heart to recover before you try again.",
          heartsRemaining: result.heartState?.hearts ?? result.heartsRemaining,
        });
        setQuizSessionId(null);
        setShowHeartGate(true);
        return;
      }

      setQuizFeedback({
        kind: "incorrect",
        message: "Not quite. Try again before moving to the next quiz.",
        heartsRemaining: result.heartState?.hearts ?? result.heartsRemaining,
      });
    } catch (err) {
      console.error("Failed to answer quiz:", err);
    } finally {
      setQuizSubmitting(false);
    }
  }

  async function submitSelectedAnswer() {
    if (selectedOption === null) return;
    await submitQuizAnswer(selectedOption);
  }

  async function handleAdvanceQuiz() {
    if (currentQuizIndex >= chapterQuizzes.length - 1) {
      await goToNextChapterOrFinish();
      return;
    }

    setCurrentQuizIndex((value) => value + 1);
    setQuizSessionId(null);
    setQuizFeedback(null);
    setSelectedOption(null);
  }

  function leaveQuiz() {
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

  if (!currentQuiz) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={storyTheme.mint} />
      </SafeAreaView>
    );
  }

  const footerAction =
    quizFeedback?.kind === "correct"
      ? {
          label:
            currentQuizIndex >= chapterQuizzes.length - 1
              ? "Finish quiz"
              : "Next quiz",
          style: styles.footerButtonSuccess,
          onPress: () => void handleAdvanceQuiz(),
          disabled: false,
        }
      : quizFeedback?.kind === "incorrect"
        ? {
            label: "Try again",
            style: styles.footerButtonDanger,
            onPress: () => {
              setQuizFeedback(null);
              setSelectedOption(null);
            },
            disabled: false,
          }
        : quizFeedback?.kind === "failed"
          ? {
              label: hasHearts ? "Start again" : "Out of hearts",
              style: hasHearts
                ? styles.footerButtonDanger
                : styles.footerButtonDisabled,
              onPress: () => {
                if (!hasHearts) {
                  setShowHeartGate(true);
                  return;
                }
                setQuizSessionId(null);
                setQuizFeedback(null);
                setSelectedOption(null);
              },
              disabled: !hasHearts,
            }
          : {
              label: "Validate answer",
              style: canValidate
                ? styles.footerButtonPrimary
                : styles.footerButtonDisabled,
              onPress: () => void submitSelectedAnswer(),
              disabled: !canValidate,
            };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={leaveQuiz} style={styles.topIcon}>
          <MaterialIcons name="close" size={18} color="#fff" />
        </Pressable>
        <View style={styles.progressShell}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(progressRatio, 0.08) * 100}%` },
              ]}
            />
          </View>
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
            style={[styles.options, isTrueFalse && styles.optionsTrueFalse]}
          >
            {currentQuiz.options.map((option, index) => (
              <Pressable
                key={`${currentQuiz.id}-${index}`}
                onPress={() => setSelectedOption(index)}
                disabled={quizSubmitting || Boolean(quizFeedback)}
                style={({ pressed }) => [
                  styles.optionCard,
                  isTrueFalse && styles.optionCardTrueFalse,
                  isImageChoice && styles.optionCardImageChoice,
                  selectedOption === index && styles.optionCardSelected,
                  pressed && !quizSubmitting ? styles.optionCardPressed : null,
                ]}
              >
                {isImageChoice ? (
                  <ImageOptionCard
                    uri={optionImages[index] ?? undefined}
                    label={option}
                    selected={selectedOption === index}
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
              <Text style={styles.feedbackText}>{quizFeedback.message}</Text>
              {typeof quizFeedback.heartsRemaining === "number" ? (
                <Text style={styles.feedbackMeta}>
                  {`Hearts left: ${quizFeedback.heartsRemaining}`}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.helperText}>
            {quizFeedback
              ? quizFeedback.kind === "correct"
                ? "Nice. You can move to the next quiz."
                : "Review the feedback, then use the button below."
              : selectedOption === null
                ? "Choose one answer to validate."
                : "Tap validate answer when you are ready."}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footerDock, { paddingBottom: insets.bottom + 12 }]}>
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
}: {
  uri?: string;
  label: string;
  selected?: boolean;
}) {
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
      <View
        style={[
          styles.imageLabelWrap,
          selected && styles.imageLabelWrapSelected,
        ]}
      >
        <Text style={styles.imageOptionLabel}>{label}</Text>
      </View>
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
  },
  optionCardSelected: {
    borderColor: storyTheme.navy,
    backgroundColor: "#eef4ff",
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
    gap: 10,
  },
  imageFrame: {
    height: 180,
    borderRadius: 5,
    backgroundColor: "#e8decf",
    borderWidth: 1,
    borderColor: storyTheme.line,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imageFrameSelected: {
    borderColor: storyTheme.navy,
  },
  optionImage: {
    ...StyleSheet.absoluteFillObject,
  },
  imageLabelWrap: {
    backgroundColor: storyTheme.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: storyTheme.line,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  imageLabelWrapSelected: {
    backgroundColor: "#eef4ff",
    borderColor: storyTheme.navy,
  },
  imageFallbackLabel: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  imageOptionLabel: {
    color: storyTheme.ink,
    fontSize: 15,
    lineHeight: 22,
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
