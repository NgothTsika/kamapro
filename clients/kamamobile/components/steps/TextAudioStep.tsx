import React from "react";
import { View, StyleSheet } from "react-native";
import {
  getParagraphs,
  StoryParagraphs,
  StoryPrimaryButton,
  StoryTitleBlock,
} from "./story-ui";
import { NarrationPlayerButton } from "./NarrationPlayerButton";

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
  const paragraphs = getParagraphs(content.body, content.details);

  return (
    <View style={styles.container}>
      <StoryTitleBlock
        eyebrow={content.eyebrow ?? "Narrated Step"}
        title={content.title}
        subtitle={content.subtitle}
      />
      <StoryParagraphs paragraphs={paragraphs} />

      {mediaUrl && (
        <NarrationPlayerButton
          mediaUrl={mediaUrl}
          label="Play narration"
          onPlaybackStart={onAudioStart}
          onPlaybackEnd={onAudioFinished}
        />
      )}

      {showAction ? (
        <StoryPrimaryButton
          label={content.buttonLabel ?? "Continue"}
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
