import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import {
  getParagraphs,
  StoryParagraphs,
  StoryPrimaryButton,
  StoryTitleBlock,
} from "./story-ui";
import { NarrationPlayerButton } from "./NarrationPlayerButton";
import { useAudioPreferences } from "@/lib/audio/audio-preferences-context";

interface Props {
  content: any;
  mediaUrl?: string;
  onComplete: () => void;
  showAction?: boolean;
  onAudioStart?: () => void;
  onAudioFinished?: () => void;
  pauseAudioSignal?: number;
  resumeAudioSignal?: number;
  stopAudioSignal?: number;
  hideBody?: boolean;
  readingEnabled?: boolean;
}

export function TextAudioStep({
  content,
  mediaUrl,
  onComplete,
  showAction = true,
  onAudioStart,
  onAudioFinished,
  pauseAudioSignal,
  resumeAudioSignal,
  stopAudioSignal,
  hideBody = false,
  readingEnabled = true,
}: Props) {
  const { t } = useTranslation();
  const { preferences } = useAudioPreferences();
  const paragraphs = getParagraphs(
    content.paragraphs,
    content.body,
    content.details,
  );

  return (
    <View style={styles.container}>
      <StoryTitleBlock
        eyebrow={content.eyebrow ?? t("story.narratedStep")}
        title={content.title}
        subtitle={content.subtitle}
      />
      {!hideBody ? <StoryParagraphs paragraphs={paragraphs} /> : null}

      {mediaUrl && (
        <NarrationPlayerButton
          mediaUrl={mediaUrl}
          label={t("audio.playNarration")}
          onPlaybackStart={onAudioStart}
          onPlaybackEnd={onAudioFinished}
          autoPlay={
            readingEnabled &&
            preferences.narrationEnabled &&
            preferences.autoPlayNarration
          }
          autoPlayDelayMs={preferences.narrationStartDelaySeconds * 1000}
          playbackVolume={preferences.narrationVolume}
          playbackRate={preferences.narrationSpeed}
          pauseSignal={pauseAudioSignal}
          resumeSignal={resumeAudioSignal}
          stopSignal={stopAudioSignal}
        />
      )}

      {showAction ? (
        <StoryPrimaryButton
          label={content.buttonLabel ?? t("story.continue")}
          onPress={onComplete}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 22,
  },
});
