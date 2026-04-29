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
}

export function TextAudioStep({
  content,
  mediaUrl,
  onComplete,
  showAction = true,
  onAudioStart,
  onAudioFinished,
}: Props) {
  const { t } = useTranslation();
  const { preferences } = useAudioPreferences();
  const paragraphs = getParagraphs(content.body, content.details);

  return (
    <View style={styles.container}>
      <StoryTitleBlock
        eyebrow={content.eyebrow ?? t("story.narratedStep")}
        title={content.title}
        subtitle={content.subtitle}
      />
      <StoryParagraphs paragraphs={paragraphs} />

      {mediaUrl && (
        <NarrationPlayerButton
          mediaUrl={mediaUrl}
          label={t("audio.playNarration")}
          onPlaybackStart={onAudioStart}
          onPlaybackEnd={onAudioFinished}
          autoPlay={
            preferences.narrationEnabled && preferences.autoPlayNarration
          }
          playbackVolume={preferences.narrationVolume}
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
