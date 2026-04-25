import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  StoryParagraphs,
  StoryTitleBlock,
  getParagraphs,
  storyColors,
} from "./story-ui";
import { NarrationPlayerButton } from "./NarrationPlayerButton";

interface Props {
  chapterOrder: number;
  chapterTitle: string;
  lessonTitle?: string;
  introText?: string | null;
  introAudioUrl?: string | null;
  onAudioStart?: () => void;
  onAudioFinished?: () => void;
}

export function ChapterIntroStep({
  chapterOrder,
  chapterTitle,
  lessonTitle,
  introText,
  introAudioUrl,
  onAudioStart,
  onAudioFinished,
}: Props) {
  const paragraphs = getParagraphs(introText);

  return (
    <View style={styles.container}>
      <StoryTitleBlock
        eyebrow={`Chapter ${chapterOrder}`}
        title={chapterTitle}
        subtitle={lessonTitle}
      />

      {paragraphs.length > 0 ? (
        <View style={styles.introCard}>
          <Text style={styles.introLabel}>Intro</Text>
          <StoryParagraphs paragraphs={paragraphs} />
        </View>
      ) : null}

      {introAudioUrl ? (
        <NarrationPlayerButton
          mediaUrl={introAudioUrl}
          label="Play chapter narration"
          onPlaybackStart={onAudioStart}
          onPlaybackEnd={onAudioFinished}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 22,
  },
  introCard: {
    backgroundColor: storyColors.paperSoft,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: storyColors.sandLine,
    gap: 12,
  },
  introLabel: {
    color: "#d67d37",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
