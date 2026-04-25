import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
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

export function PollStep({
  content,
  stepId,
  lessonId,
  chapterId,
  onComplete,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const { submitResponse, loading } = useStepResponse();

  async function handleSubmit() {
    if (selectedOption === null) return;

    try {
      await submitResponse({
        lessonId,
        chapterId,
        stepId,
        type: "poll",
        selectedOption,
      });
      onComplete();
    } catch (err) {
      console.error("Failed to submit response:", err);
    }
  }

  return (
    <View style={styles.container}>
      <StoryTitleBlock
        eyebrow={content.eyebrow ?? "Choose Your Move"}
        title={content.question}
        subtitle={content.description}
      />

      <View style={styles.options}>
        {content.options?.map((option: string, idx: number) => (
          <StoryOptionButton
            key={idx}
            onPress={() => setSelectedOption(idx)}
            selected={selectedOption === idx}
            label={option}
          />
        ))}
      </View>

      <StoryPrimaryButton
        label={content.buttonLabel ?? "Pick an Answer"}
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
});
