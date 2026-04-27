import React from "react";
import { StyleSheet, View } from "react-native";
import type { ChapterStep } from "@/lib/types";
import { ChoiceStep } from "@/components/steps/ChoiceStep";
import { ContinueButtonStep } from "@/components/steps/ContinueButtonStep";
import { ImageFullStep } from "@/components/steps/ImageFullStep";
import { PollStep } from "@/components/steps/PollStep";
import { QuizStep } from "@/components/steps/QuizStep";
import { RecapStep } from "@/components/steps/RecapStep";
import { TextAudioStep } from "@/components/steps/TextAudioStep";
import { TextStep } from "@/components/steps/TextStep";

interface Props {
  step: ChapterStep;
  lessonId: string;
  chapterId: string;
  onStepComplete: () => void;
  useFixedFooter?: boolean;
  onAudioStart?: () => void;
  onAudioFinished?: () => void;
  mediaUrl?: string;
}

export function StepRenderer({
  step,
  lessonId,
  chapterId,
  onStepComplete,
  useFixedFooter = false,
  onAudioStart,
  onAudioFinished,
}: Props) {
  return (
    <View style={styles.stepContainer}>
      {step.type === "TEXT" && (
        <TextStep
          content={step.content}
          onComplete={onStepComplete}
          showAction={!useFixedFooter}
        />
      )}

      {step.type === "TEXT_AUDIO" && (
        <TextAudioStep
          content={step.content}
          mediaUrl={step.mediaUrl ?? undefined}
          onComplete={onStepComplete}
          showAction={!useFixedFooter}
          onAudioStart={onAudioStart}
          onAudioFinished={onAudioFinished}
        />
      )}

      {step.type === "IMAGE_FULL" && (
        <ImageFullStep
          content={step.content}
          mediaUrl={step.mediaUrl ?? undefined}
          onComplete={onStepComplete}
          showAction={!useFixedFooter}
          showMedia={!useFixedFooter}
        />
      )}

      {step.type === "POLL" && (
        <PollStep
          content={step.content}
          stepId={step.id}
          lessonId={lessonId}
          chapterId={chapterId}
          onComplete={onStepComplete}
        />
      )}

      {step.type === "CHOICE" && (
        <ChoiceStep
          content={step.content}
          stepId={step.id}
          lessonId={lessonId}
          chapterId={chapterId}
          onComplete={onStepComplete}
        />
      )}

      {step.type === "QUIZ_QUESTION" && (
        <QuizStep
          content={step.content}
          stepId={step.id}
          lessonId={lessonId}
          chapterId={chapterId}
          onComplete={onStepComplete}
        />
      )}

      {step.type === "RECAP" && (
        <RecapStep
          content={step.content}
          onComplete={onStepComplete}
          showAction={!useFixedFooter}
        />
      )}

      {step.type === "CONTINUE_BUTTON" && (
        <ContinueButtonStep
          onComplete={onStepComplete}
          label={step.content?.buttonLabel ?? "Continue"}
          title={step.content?.title ?? "Ready to continue?"}
          subtitle={step.content?.subtitle ?? "The next scene is waiting."}
          body={
            step.content?.body ??
            "Move forward when you are ready for the next beat of the story."
          }
          showAction={!useFixedFooter}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    padding: 0,
  },
});
