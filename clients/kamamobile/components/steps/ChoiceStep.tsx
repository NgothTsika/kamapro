import React, { useState } from "react";
import {
  View,
  StyleSheet,
} from "react-native";
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

export function ChoiceStep({
  content,
  stepId,
  lessonId,
  chapterId,
  onComplete,
}: Props) {
  const { submitResponse, loading } = useStepResponse();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  async function handleChoice() {
    if (selectedIndex === null) return;

    try {
      await submitResponse({
        lessonId,
        chapterId,
        stepId,
        type: "choice",
        selectedOption: selectedIndex,
        chosenStepId: content.options?.[selectedIndex]?.nextStepId,
      });
      onComplete();
    } catch (err) {
      console.error("Failed to submit choice:", err);
      setSelectedIndex(null);
    }
  }

  return (
    <View style={styles.container}>
      <StoryTitleBlock
        eyebrow={content.eyebrow ?? "Decision"}
        title={content.prompt}
        subtitle={content.description}
      />

      <View style={styles.choices}>
        {content.options?.map((option: any, idx: number) => (
          <StoryOptionButton
            key={idx}
            label={option.text || option}
            hint={option.description}
            selected={selectedIndex === idx}
            onPress={() => setSelectedIndex(idx)}
            dark
            disabled={loading}
          />
        ))}
      </View>
      <StoryPrimaryButton
        label={content.buttonLabel ?? "Continue"}
        onPress={handleChoice}
        disabled={selectedIndex === null}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 22,
  },
  choices: {
    gap: 12,
  },
});
