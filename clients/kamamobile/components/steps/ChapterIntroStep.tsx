import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  StoryParagraphSlider,
  StoryParagraphs,
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
  introParagraphSlides?: unknown;
  introAudioUrl?: string | null;
  heroBackgroundColor?: string;
  onAudioStart?: () => void;
  onAudioFinished?: () => void;
  pauseAudioSignal?: number;
  resumeAudioSignal?: number;
  stopAudioSignal?: number;
  readingEnabled?: boolean;
  onParagraphSlidesStateChange?: (state: {
    hasSlides: boolean;
    completed: boolean;
  }) => void;
}

export function ChapterIntroStep({
  chapterOrder,
  chapterTitle,
  lessonTitle,
  introText,
  introParagraphSlides,
  introAudioUrl,
  heroBackgroundColor,
  onAudioStart,
  onAudioFinished,
  pauseAudioSignal,
  resumeAudioSignal,
  stopAudioSignal,
  readingEnabled = true,
  onParagraphSlidesStateChange,
}: Props) {
  const { t } = useTranslation();
  const { preferences } = useAudioPreferences();
  const slideParagraphs = getParagraphs(introParagraphSlides);
  const paragraphs = getParagraphs(introText);
  const hasSlides = slideParagraphs.length > 1;
  const staticParagraphs = hasSlides ? [] : paragraphs;

  const hasContent = paragraphs.length > 0 || introAudioUrl;

  return (
    <View style={styles.fullScreenContainer}>
      {/* Hero Background Section - Full Width */}

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Title with enhanced typography */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>{chapterTitle}</Text>
          {lessonTitle ? (
            <Text style={styles.subtitle}>{lessonTitle}</Text>
          ) : null}
        </View>

        {/* Intro Text Card */}
        {staticParagraphs.length > 0 ? (
          <View style={styles.introCard}>
            <View style={styles.introLabelContainer}>
              <Text style={styles.introLabel}>{t("story.intro")}</Text>
              <View style={styles.labelDivider} />
            </View>
            <StoryParagraphs paragraphs={staticParagraphs} />
          </View>
        ) : null}

        {hasSlides ? (
          <View style={styles.introCard}>
            <View style={styles.introLabelContainer}>
              <Text style={styles.introLabel}>{t("story.intro")}</Text>
              <View style={styles.labelDivider} />
            </View>
            <StoryParagraphSlider
              slides={slideParagraphs}
              onStateChange={onParagraphSlidesStateChange}
              readingEnabled={readingEnabled}
              pauseAudioSignal={pauseAudioSignal}
              resumeAudioSignal={resumeAudioSignal}
              stopAudioSignal={stopAudioSignal}
              startDelayMs={0}
            />
          </View>
        ) : null}

        {/* Audio Player */}
        {introAudioUrl ? (
          <View style={styles.audioContainer}>
            <NarrationPlayerButton
              mediaUrl={introAudioUrl}
              label={t("audio.playChapterNarration")}
              onPlaybackStart={onAudioStart}
              onPlaybackEnd={onAudioFinished}
              autoPlay={
                !hasSlides &&
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
          </View>
        ) : null}

        {!hasContent ? (
          <View style={styles.introCard}>
            <Text style={styles.emptyIntroText}>
              Get ready for the next scene.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    backgroundColor: storyColors.paper,
  },
  heroSection: {
    height: 132,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  badgeContainer: {
    position: "absolute",
    zIndex: 2,
  },
  chapterBadge: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  contentSection: {
    paddingHorizontal: 0,
    paddingVertical: 12,
    gap: 18,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: storyColors.navy,
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: storyColors.inkMuted,
    letterSpacing: 0.5,
  },
  introCard: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255, 248, 238, 0.95)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "rgba(214, 125, 55, 0.15)",
    gap: 16,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  introLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  introLabel: {
    color: "#d67d37",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  labelDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(214, 125, 55, 0.2)",
  },
  audioContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  emptyIntroText: {
    color: storyColors.ink,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
  },
});
