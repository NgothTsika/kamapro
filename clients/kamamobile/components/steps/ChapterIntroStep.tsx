import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  StoryParagraphs,
  StoryTitleBlock,
  getParagraphs,
  storyColors,
} from "./story-ui";
import { NarrationPlayerButton } from "./NarrationPlayerButton";
import { useAudioPreferences } from "@/lib/audio/audio-preferences-context";

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
  const { t } = useTranslation();
  const { preferences } = useAudioPreferences();
  const paragraphs = getParagraphs(introText);

  return (
    <View style={styles.container}>
      <StoryTitleBlock
        eyebrow={`${t("story.chapter")} ${chapterOrder}`}
        title={chapterTitle}
        subtitle={lessonTitle}
      />

      {paragraphs.length > 0 ? (
        <View style={styles.introCard}>
          <Text style={styles.introLabel}>{t("story.intro")}</Text>
          <StoryParagraphs paragraphs={paragraphs} />
        </View>
      ) : null}

      {introAudioUrl ? (
        <NarrationPlayerButton
          mediaUrl={introAudioUrl}
          label={t("audio.playChapterNarration")}
          onPlaybackStart={onAudioStart}
          onPlaybackEnd={onAudioFinished}
          autoPlay={
            preferences.narrationEnabled && preferences.autoPlayNarration
          }
          playbackVolume={preferences.narrationVolume}
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
