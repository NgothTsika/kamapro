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
import {
  getParagraphs,
  StoryParagraphSlider,
} from "@/components/steps/story-ui";

interface Props {
  step: ChapterStep;
  lessonId: string;
  chapterId: string;
  onStepComplete: () => void;
  useFixedFooter?: boolean;
  onAudioStart?: () => void;
  onAudioFinished?: () => void;
  pauseAudioSignal?: number;
  resumeAudioSignal?: number;
  stopAudioSignal?: number;
  mediaUrl?: string;
  readingEnabled?: boolean;
  onParagraphSlidesStateChange?: (state: {
    hasSlides: boolean;
    completed: boolean;
  }) => void;
}

export function StepRenderer({
  step,
  lessonId,
  chapterId,
  onStepComplete,
  useFixedFooter = false,
  onAudioStart,
  onAudioFinished,
  pauseAudioSignal,
  resumeAudioSignal,
  stopAudioSignal,
  readingEnabled = true,
  onParagraphSlidesStateChange,
}: Props) {
  const paragraphSlideSource = [
    step.content?.paragraphSlides,
    step.content?.slides,
  ];
  const hasParagraphSlides = getParagraphs(paragraphSlideSource).length > 1;

  return (
    <View style={styles.stepContainer}>
      {step.type === "TEXT" && (
        <TextStep
          content={step.content}
          onComplete={onStepComplete}
          showAction={!useFixedFooter}
          hideBody={hasParagraphSlides}
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
          pauseAudioSignal={pauseAudioSignal}
          resumeAudioSignal={resumeAudioSignal}
          stopAudioSignal={stopAudioSignal}
          hideBody={hasParagraphSlides}
          readingEnabled={readingEnabled}
        />
      )}

      {step.type === "IMAGE_FULL" && (
        <ImageFullStep
          content={step.content}
          mediaUrl={step.mediaUrl ?? undefined}
          onComplete={onStepComplete}
          showAction={!useFixedFooter}
          showMedia={!useFixedFooter}
          hideBody={hasParagraphSlides}
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

      <StoryParagraphSlider
        slides={paragraphSlideSource}
        onStateChange={onParagraphSlidesStateChange}
        readingEnabled={readingEnabled}
        pauseAudioSignal={pauseAudioSignal}
        resumeAudioSignal={resumeAudioSignal}
        stopAudioSignal={stopAudioSignal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    padding: 0,
  },
});
