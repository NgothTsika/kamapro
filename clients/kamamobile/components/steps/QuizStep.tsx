import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useStepResponse } from "../../hooks/useStepResponse";
import {
  StoryOptionButton,
  StoryPrimaryButton,
  StoryTitleBlock,
} from "./story-ui";

interface Props {
  content: any;
  stepId: string;
  lessonId: string;
  chapterId: string;
  onComplete: () => void;
}

export function QuizStep({
  content,
  stepId,
  lessonId,
  chapterId,
  onComplete,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const { submitResponse, loading } = useStepResponse();

  const isCorrect = selectedOption === content.correctOption;
  const quizType = content.quizType ?? "multiple_choice";
  const optionImages = Array.isArray(content.optionImages)
    ? content.optionImages
    : [];
  const isImageChoice =
    quizType === "image_choice" &&
    optionImages.length > 0 &&
    optionImages.length === content.options?.length;

  async function handleSubmit() {
    if (selectedOption === null) return;

    try {
      await submitResponse({
        lessonId,
        chapterId,
        stepId,
        type: "quiz",
        selectedOption,
      });
      setShowFeedback(true);
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  }

  if (showFeedback) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.feedback,
            isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              isCorrect
                ? styles.feedbackCorrectText
                : styles.feedbackIncorrectText,
            ]}
          >
            {isCorrect ? "Correct!" : "Try Again"}
          </Text>
          <Text style={styles.feedbackMessage}>
            {isCorrect
              ? "You read the moment exactly right."
              : "The story has a sharper answer waiting for you."}
          </Text>
        </View>

        {content.explanation ? (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>Deep Dive</Text>
            <Text style={styles.explanationText}>{content.explanation}</Text>
          </View>
        ) : null}

        <StoryPrimaryButton
          label={content.buttonLabel ?? "Continue"}
          onPress={onComplete}
          loading={loading}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StoryTitleBlock
        eyebrow={content.eyebrow ?? "Quiz"}
        title={content.question}
        subtitle={content.subtitle}
      />

      <View style={styles.options}>
        {content.options?.map((option: string, idx: number) =>
          isImageChoice ? (
            <Pressable
              key={idx}
              onPress={() => setSelectedOption(idx)}
              style={[
                styles.imageOptionCard,
                selectedOption === idx && styles.imageOptionShellSelected,
              ]}
            >
              <Image
                source={{ uri: optionImages[idx] }}
                style={styles.optionImage}
                resizeMode="cover"
              />
              <Text style={styles.imageOptionLabel}>
                {option || `Option ${idx + 1}`}
              </Text>
            </Pressable>
          ) : (
            <StoryOptionButton
              key={idx}
              label={option}
              selected={selectedOption === idx}
              onPress={() => setSelectedOption(idx)}
              dark
            />
          ),
        )}
      </View>

      <StoryPrimaryButton
        label={content.submitLabel ?? "Check"}
        onPress={handleSubmit}
        disabled={selectedOption === null}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 22,
  },
  options: {
    gap: 12,
  },
  imageOptionCard: {
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d8d0c1",
    padding: 12,
  },
  imageOptionShellSelected: {
    transform: [{ scale: 1.01 }],
    borderColor: "#263b5e",
    backgroundColor: "#f2f5fb",
  },
  optionImage: {
    width: "100%",
    height: 180,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d8d0c1",
    backgroundColor: "#f4ecdf",
  },
  imageOptionLabel: {
    color: "#21314f",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
  },
  feedback: {
    borderRadius: 24,
    padding: 22,
    gap: 8,
  },
  feedbackCorrect: {
    backgroundColor: "#eef9f1",
    borderWidth: 1,
    borderColor: "#abdcb6",
  },
  feedbackIncorrect: {
    backgroundColor: "#fff0ed",
    borderWidth: 1,
    borderColor: "#efbaa9",
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: "900",
  },
  feedbackCorrectText: {
    color: "#2f7a46",
  },
  feedbackIncorrectText: {
    color: "#b25740",
  },
  feedbackMessage: {
    color: "#21314f",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
  explanation: {
    backgroundColor: "#fff8ee",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#f3d7ad",
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#d67d37",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 15,
    color: "#21314f",
    lineHeight: 24,
    fontWeight: "600",
  },
});
