import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { useStepResponse } from "../../hooks/useStepResponse";
import { useTranslation } from "react-i18next";
import {
  StoryOptionButton,
  StoryPrimaryButton,
  StoryTitleBlock,
} from "./story-ui";

type QuizType = "multiple_choice" | "true_false" | "image_choice";

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
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const { submitResponse, loading } = useStepResponse();

  const isCorrect = selectedOption === content.correctOption;
  const quizType = (content.quizType ?? "multiple_choice") as QuizType;
  const optionImages = Array.isArray(content.optionImages)
    ? content.optionImages
    : [];
  const isImageChoice =
    quizType === "image_choice" &&
    optionImages.length > 0 &&
    optionImages.length === content.options?.length;
  const isTrueFalse = quizType === "true_false";

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

  // Render feedback screen
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
            {isCorrect ? t("quiz.correct") : t("quiz.incorrect")}
          </Text>
          <Text style={styles.feedbackMessage}>
            {isCorrect ? t("quiz.correctMessage") : t("quiz.incorrectMessage")}
          </Text>
        </View>

        {content.explanation ? (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>{t("quiz.deepDive")}</Text>
            <Text style={styles.explanationText}>{content.explanation}</Text>
          </View>
        ) : null}

        <StoryPrimaryButton
          label={content.buttonLabel ?? t("story.continue")}
          onPress={onComplete}
          loading={loading}
        />
      </View>
    );
  }

  // Render True/False quiz
  if (isTrueFalse) {
    return (
      <View style={styles.container}>
        <StoryTitleBlock
          eyebrow={content.eyebrow ?? t("quiz.trueOrFalse")}
          title={content.question}
          subtitle={content.subtitle}
        />

        <View style={styles.trueFalseContainer}>
          <Pressable
            onPress={() => setSelectedOption(0)}
            style={[
              styles.trueFalseButton,
              styles.trueFalseTrue,
              selectedOption === 0 && styles.trueFalseTrueSelected,
            ]}
          >
            <Text
              style={[
                styles.trueFalseButtonText,
                selectedOption === 0 && styles.trueFalseTrueSelectedText,
              ]}
            >
              {t("common.close")}
            </Text>
            <Text
              style={[
                styles.trueFalseLabel,
                selectedOption === 0 && styles.trueFalseTrueSelectedLabel,
              ]}
            >
              True
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedOption(1)}
            style={[
              styles.trueFalseButton,
              styles.trueFalseFalse,
              selectedOption === 1 && styles.trueFalseFalseSelected,
            ]}
          >
            <Text
              style={[
                styles.trueFalseButtonText,
                selectedOption === 1 && styles.trueFalseFalseSelectedText,
              ]}
            >
              {t("common.close")}
            </Text>
            <Text
              style={[
                styles.trueFalseLabel,
                selectedOption === 1 && styles.trueFalseFalseSelectedLabel,
              ]}
            >
              False
            </Text>
          </Pressable>
        </View>

        <StoryPrimaryButton
          label={content.submitLabel ?? t("quiz.check")}
          onPress={handleSubmit}
          disabled={selectedOption === null}
          loading={loading}
        />
      </View>
    );
  }

  // Render Image Choice quiz
  if (isImageChoice) {
    return (
      <View style={styles.container}>
        <StoryTitleBlock
          eyebrow={content.eyebrow ?? t("quiz.imageChoice")}
          title={content.question}
          subtitle={content.subtitle}
        />

        <View style={styles.imageOptionsGrid}>
          {content.options?.map((option: string, idx: number) => (
            <Pressable
              key={idx}
              onPress={() => setSelectedOption(idx)}
              style={[
                styles.imageOptionWrapper,
                idx % 2 === 1 && styles.imageOptionWrapperRight,
              ]}
            >
              <View
                style={[
                  styles.imageOptionCard,
                  selectedOption === idx && styles.imageOptionCardSelected,
                ]}
              >
                <Image
                  source={{ uri: optionImages[idx] }}
                  style={styles.optionImage}
                  resizeMode="cover"
                />
              </View>
              {(selectedOption === idx || isCorrect) && (
                <Text
                  style={[
                    styles.imageOptionLabel,
                    selectedOption === idx && styles.imageOptionLabelSelected,
                  ]}
                >
                  {option || `Option ${idx + 1}`}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        <StoryPrimaryButton
          label={content.submitLabel ?? t("quiz.check")}
          onPress={handleSubmit}
          disabled={selectedOption === null}
          loading={loading}
        />
      </View>
    );
  }

  // Render default Multiple Choice quiz
  return (
    <View style={styles.container}>
      <StoryTitleBlock
        eyebrow={content.eyebrow ?? t("quiz.multipleChoice")}
        title={content.question}
        subtitle={content.subtitle}
      />

      <View style={styles.options}>
        {content.options?.map((option: string, idx: number) => (
          <StoryOptionButton
            key={idx}
            label={option}
            selected={selectedOption === idx}
            onPress={() => setSelectedOption(idx)}
            dark
          />
        ))}
      </View>

      <StoryPrimaryButton
        label={content.submitLabel ?? t("quiz.check")}
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
  // True/False styles
  trueFalseContainer: {
    flexDirection: "row",
    gap: 12,
  },
  trueFalseButton: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 2,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  trueFalseTrue: {
    borderColor: "#58b874",
    backgroundColor: "#f8fdf8",
  },
  trueFalseFalse: {
    borderColor: "#ff6b6b",
    backgroundColor: "#fff8f8",
  },
  trueFalseTrueSelected: {
    backgroundColor: "#eef9f1",
    borderColor: "#2f7a46",
  },
  trueFalseFalseSelected: {
    backgroundColor: "#fff0ed",
    borderColor: "#b25740",
  },
  trueFalseButtonText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  trueFalseTrueSelectedText: {
    color: "#2f7a46",
  },
  trueFalseFalseSelectedText: {
    color: "#b25740",
  },
  trueFalseLabel: {
    fontSize: 28,
    fontWeight: "900",
    color: "#21314f",
  },
  trueFalseTrueSelectedLabel: {
    color: "#2f7a46",
  },
  trueFalseFalseSelectedLabel: {
    color: "#b25740",
  },
  // Image choice styles
  imageOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageOptionWrapper: {
    width: "48%",
    gap: 8,
  },
  imageOptionWrapperRight: {
    marginLeft: "2%",
  },
  imageOptionCard: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  imageOptionCardSelected: {
    backgroundColor: "#f2f5fb",
  },
  optionImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#f4ecdf",
  },
  imageOptionLabel: {
    color: "#21314f",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  imageOptionLabelSelected: {
    color: "#263b5e",
  },
  // Feedback styles
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
