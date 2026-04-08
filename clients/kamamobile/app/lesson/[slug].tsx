import {
  AnimatedLessonProgressBar,
  ChapterCarousel,
  FeedbackStars,
  LessonCelebration,
  QuizOptionCard,
  QuizResultModal,
  type QuizResultVariant,
} from "@/components/lesson";
import {
  answerQuiz,
  completeLesson,
  getLessonBySlug,
  getStreak,
  startQuizSession,
  submitLessonFeedback,
  submitPollVote,
  type LessonFull,
  type LessonQuizQuestion,
} from "@/lib/api";
import {
  defaultTrueFalseOptions,
  normalizeOptionImages,
  normalizeQuizType,
  normalizeStringList,
} from "@/lib/quiz/normalize";
import { useAuth } from "@/lib/auth/auth-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

type Stage = "intro" | "read" | "quiz" | "celebration" | "feedback" | "done";

function useNormalizedQuiz(quiz: LessonQuizQuestion | undefined) {
  return useMemo(() => {
    if (!quiz) return null;
    const type = normalizeQuizType(quiz.type);
    let labels = normalizeStringList(quiz.options);
    if (type === "true_false") labels = defaultTrueFalseOptions(labels);
    const isPoll = Boolean(quiz.isPoll) || type === "poll";
    const images =
      type === "image_choice"
        ? normalizeOptionImages(quiz.optionImages, labels.length)
        : labels.map(() => null as string | null);
    return { type, labels, images, isPoll, pollDescription: quiz.pollDescription };
  }, [quiz]);
}

export default function LessonFlowScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { token } = useAuth();
  const [lesson, setLesson] = useState<LessonFull | null>(null);
  const [stage, setStage] = useState<Stage>("intro");
  const [chapterIndex, setChapterIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionNonce, setSessionNonce] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");

  const [celebration, setCelebration] = useState({ xp: 0, streak: 0 });

  const [resultModal, setResultModal] = useState<{
    visible: boolean;
    variant: QuizResultVariant;
    title: string;
    message: string;
    explanation?: string | null;
    heartsRemaining?: number;
  }>({
    visible: false,
    variant: "correct",
    title: "",
    message: "",
  });

  useEffect(() => {
    if (!slug) return;
    getLessonBySlug(slug)
      .then((result) => setLesson(result))
      .catch(() => setLesson(null));
  }, [slug]);

  const readCardCount = useMemo(() => {
    if (!lesson) return 1;
    return lesson.chapters.length > 0 ? lesson.chapters.length : 1;
  }, [lesson]);

  const readProgress = (chapterIndex + 1) / readCardCount;

  const currentQuiz = lesson?.quizzes[quizIndex];
  const normalized = useNormalizedQuiz(currentQuiz);

  useEffect(() => {
    if (!token || !lesson || stage !== "quiz") return;
    const q = lesson.quizzes[quizIndex];
    if (!q) return;
    const t = normalizeQuizType(q.type);
    const isPoll = Boolean(q.isPoll) || t === "poll";
    if (isPoll) {
      setSessionId(null);
      return;
    }

    startQuizSession(token, q.id)
      .then((res) => setSessionId(res.sessionId))
      .catch(() => setSessionId(null));
  }, [token, lesson, stage, quizIndex, sessionNonce]);

  if (!lesson) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0e0a06", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "white" }}>Loading lesson...</Text>
      </View>
    );
  }

  async function finishAllQuizzes() {
    if (!token) return;
    try {
      const res = await completeLesson(token, lesson.id);
      const streakRes = await getStreak(token);
      setCelebration({
        xp: res.xpEarned ?? lesson.xpReward ?? 0,
        streak: streakRes.currentStreak ?? 0,
      });
      setStage("celebration");
    } catch {
      setCelebration({ xp: lesson.xpReward ?? 0, streak: 0 });
      setStage("celebration");
    }
  }

  function advanceQuizAfterCorrect() {
    const next = quizIndex + 1;
    if (next >= lesson.quizzes.length) {
      void finishAllQuizzes();
    } else {
      setQuizIndex(next);
      setSelectedOption(null);
      setSessionId(null);
      setSessionNonce((n) => n + 1);
    }
  }

  async function submitQuizAnswer() {
    if (!token || selectedOption === null || !currentQuiz || !normalized) return;

    if (normalized.isPoll) {
      try {
        await submitPollVote(token, currentQuiz.id, selectedOption);
        setResultModal({
          visible: true,
          variant: "poll",
          title: "Poll",
          message: "Your answer was recorded.",
          explanation: currentQuiz.explanation,
        });
      } catch {
        setResultModal({
          visible: true,
          variant: "failed",
          title: "Poll",
          message: "Could not submit your vote.",
          explanation: null,
        });
      }
      return;
    }

    if (sessionId === null) return;

    try {
      const result = await answerQuiz(token, sessionId, selectedOption);

      if (result.passed === true) {
        setResultModal({
          visible: true,
          variant: "correct",
          title: "Correct!",
          message: "The spirits approve.",
          explanation: currentQuiz.explanation,
        });
        return;
      }

      if (result.passed === false) {
        setResultModal({
          visible: true,
          variant: "failed",
          title: "Out of hearts",
          message: "You have used all chances for this question.",
          explanation: currentQuiz.explanation,
          heartsRemaining: result.heartsRemaining,
        });
        return;
      }

      setResultModal({
        visible: true,
        variant: "incorrect",
        title: "Not quite",
        message: "Try another choice.",
        explanation: null,
        heartsRemaining: result.heartsRemaining,
      });
    } catch {
      setResultModal({
        visible: true,
        variant: "failed",
        title: "Error",
        message: "Could not submit answer.",
        explanation: null,
      });
    }
  }

  function onResultModalContinue() {
    const { variant } = resultModal;
    setResultModal((m) => ({ ...m, visible: false }));

    if (variant === "correct") {
      advanceQuizAfterCorrect();
      return;
    }

    if (variant === "poll") {
      const next = quizIndex + 1;
      setSelectedOption(null);
      if (next >= lesson.quizzes.length) {
        void finishAllQuizzes();
      } else {
        setQuizIndex(next);
        setSessionNonce((n) => n + 1);
      }
      return;
    }

    if (variant === "incorrect" || variant === "failed") {
      setSelectedOption(null);
      setSessionId(null);
      setSessionNonce((n) => n + 1);
    }
  }

  async function submitFeedback() {
    if (!token) return;
    try {
      await submitLessonFeedback({
        token,
        lessonId: lesson.id,
        rating,
        comment: comment.trim() || undefined,
      });
      setStage("done");
    } catch {
      setStatus("Feedback failed to send. Please retry.");
    }
  }

  function goNextRead() {
    if (chapterIndex < readCardCount - 1) {
      setChapterIndex((v) => v + 1);
      return;
    }
    if (lesson.quizzes.length === 0) {
      void finishAllQuizzes();
    } else {
      setStage("quiz");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0e0a06" }}>
      <Stack.Screen
        options={{
          title: lesson.title,
          headerTintColor: "white",
          headerStyle: { backgroundColor: "#0e0a06" },
        }}
      />

      <QuizResultModal
        visible={resultModal.visible}
        variant={resultModal.variant}
        title={resultModal.title}
        message={resultModal.message}
        explanation={resultModal.explanation}
        heartsRemaining={resultModal.heartsRemaining}
        onContinue={onResultModalContinue}
      />

      {stage === "celebration" ? (
        <LessonCelebration
          xpEarned={celebration.xp}
          streak={celebration.streak}
          lessonTitle={lesson.title}
          onContinue={() => setStage("feedback")}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 40 }}>
          {stage === "intro" ? (
            <View style={{ gap: 12 }}>
              <Text style={{ color: "#f8d568", fontWeight: "700" }}>Lesson Intro</Text>
              <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>{lesson.title}</Text>
              <Text style={{ color: "#d0c2b0" }}>
                {lesson.hook || lesson.description || "Prepare for this wisdom quest."}
              </Text>
              <AnimatedLessonProgressBar value={0.15} />
              <Pressable
                onPress={() => setStage("read")}
                style={{ backgroundColor: "#f8d568", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ color: "#1a1a1a", fontWeight: "700" }}>Start Lesson</Text>
              </Pressable>
            </View>
          ) : null}

          {stage === "read" ? (
            <View style={{ gap: 12 }}>
              <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>Reading</Text>
              <AnimatedLessonProgressBar value={readProgress} />
              <Text style={{ color: "#d0c2b0" }}>
                Card {chapterIndex + 1} / {readCardCount}
              </Text>

              <ChapterCarousel
                lessonTitle={lesson.title}
                lessonContent={lesson.content}
                chapters={lesson.chapters}
                chapterIndex={chapterIndex}
                onChapterChange={setChapterIndex}
              />

              <Pressable
                onPress={goNextRead}
                style={{
                  backgroundColor: "#f8d568",
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Text style={{ color: "#1a1a1a", fontWeight: "700" }}>
                  {chapterIndex < readCardCount - 1
                    ? "Next card"
                    : lesson.quizzes.length === 0
                      ? "Complete lesson"
                      : "Go to Quiz"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {stage === "quiz" && currentQuiz && normalized ? (
            <View style={{ gap: 12 }}>
              <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>Quiz</Text>
              <AnimatedLessonProgressBar value={(quizIndex + 1) / Math.max(1, lesson.quizzes.length)} />
              <Text style={{ color: "#d0c2b0" }}>
                Question {quizIndex + 1} / {lesson.quizzes.length}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Text
                  style={{
                    color: "#1a1a1a",
                    backgroundColor: "#d4b87a",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                    overflow: "hidden",
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {normalized.isPoll ? "POLL" : normalized.type.replace("_", " ").toUpperCase()}
                </Text>
                {normalized.isPoll && currentQuiz.pollDescription ? (
                  <Text style={{ color: "#d0c2b0", flex: 1 }}>{currentQuiz.pollDescription}</Text>
                ) : null}
              </View>
              <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>{currentQuiz.question}</Text>
              {normalized.labels.map((label, index) => (
                <QuizOptionCard
                  key={`${currentQuiz.id}-${index}`}
                  label={label}
                  imageUrl={normalized.images[index] ?? undefined}
                  selected={selectedOption === index}
                  onPress={() => setSelectedOption(index)}
                />
              ))}
              <Pressable
                onPress={submitQuizAnswer}
                disabled={selectedOption === null}
                style={{
                  backgroundColor: "#f8d568",
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                  opacity: selectedOption === null ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "#1a1a1a", fontWeight: "700" }}>
                  {normalized.isPoll ? "Submit vote" : "Check"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {stage === "feedback" ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>Feedback</Text>
              <Text style={{ color: "#d0c2b0" }}>How was this lesson?</Text>
              <FeedbackStars rating={rating} onChange={setRating} />
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Your comment..."
                placeholderTextColor="#8a7d6f"
                multiline
                style={{
                  minHeight: 110,
                  textAlignVertical: "top",
                  borderRadius: 10,
                  backgroundColor: "#1b140e",
                  borderWidth: 1,
                  borderColor: "#3b2a1a",
                  color: "white",
                  padding: 10,
                }}
              />
              <Pressable
                onPress={submitFeedback}
                style={{ backgroundColor: "#f8d568", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ color: "#1a1a1a", fontWeight: "700" }}>Send Feedback</Text>
              </Pressable>
              {status ? <Text style={{ color: "#d0c2b0" }}>{status}</Text> : null}
            </View>
          ) : null}

          {stage === "done" ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: "#f8d568", fontWeight: "700", fontSize: 22 }}>Quest Complete</Text>
              <Text style={{ color: "white" }}>Thank you — your journey continues.</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
